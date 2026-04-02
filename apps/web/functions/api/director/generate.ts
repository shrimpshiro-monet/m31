import { validateEditPlan } from '@openreel/core';

const UPSTREAM_TIMEOUT_MS = 20_000;

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async (context: any) => {
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch (err) {
    return jsonResponse({ error: 'invalid_json', details: err instanceof Error ? err.message : String(err) }, 400);
  }

  // Basic input contract
  if (!body || !Array.isArray(body.clips)) {
    return jsonResponse({ error: 'invalid_input', details: 'missing clips array' }, 400);
  }

  // Support a refine action: when the client sends { action: 'refine', plan, instruction }
  const isRefine = body.action === 'refine' && body.plan;

  // Build a lightweight prompt payload to send to the LLM via the proxy route.
  const prompt = ((): any => {
    if (isRefine) {
      const instruction = typeof body.instruction === 'string' ? body.instruction : 'Improve the plan and fix any validation errors.';
      return {
        model: 'gemini-1.5-pro',
        prompt: `You are an assistant that edits JSON EditPlan documents.\nInstruction: ${instruction}\n\nOriginal EditPlan JSON:\n${JSON.stringify(body.plan)}\n\nReturn ONLY the complete, valid EditPlan JSON object. Do not add explanatory text.`,
        max_tokens: 800,
      };
    }

    return {
      model: 'gemini-1.5-pro',
      prompt: `Generate a valid EditPlan JSON for clips: ${JSON.stringify(body.clips)}. Style: ${body.style || 'default'}`,
      max_tokens: 800,
    } as any;
  })();

  const useModel = body.useModel ?? null;
  const testModel = (new URL(context.request.url)).searchParams.get('testModel') === 'true';

  // Call proxy to model (the proxy will forward to actual provider if configured).
  let llmRespText: string | null = null;
  try {
    if (useModel === 'github-marketplace' || testModel) {
      const modelId = context.request.headers.get('x-github-model-id') || context.env?.GITHUB_MODEL_NAME || 'gpt-4o';
      const githubPath = `/api/proxy/github/models/${modelId}/invocations`;

      const bodyPayload = testModel
        ? { input: 'Return ONLY this JSON: {"test": true}' }
        : prompt;

      try {
        const upstream = await fetch(githubPath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-proxy-api-key': context.request.headers.get('x-proxy-api-key') || context.env?.GITHUB_MODEL_TOKEN || context.env?.PROXY_API_KEY || '',
          },
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });

        llmRespText = await upstream.text();
        console.log('RAW MODEL RESPONSE:', llmRespText);
      } catch (err) {
        console.log('GitHub model call failed:', err instanceof Error ? err.message : String(err));
        llmRespText = null;
      }
    } else {
      const upstream = await fetch('/api/proxy/openai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-proxy-api-key': context.env?.PROXY_API_KEY ?? '' },
        body: JSON.stringify(prompt),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      llmRespText = await upstream.text();
    }
  } catch (err) {
    return jsonResponse({ error: 'llm_request_failed', details: err instanceof Error ? err.message : String(err) }, 502);
  }

  // Extract JSON safely: try to find first JSON block.
  const jsonMatch = llmRespText?.match(/\{[\s\S]*\}/);
  let parsed: any = null;
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      parsed = null;
    }
  }

  // If initial parse failed, attempt a simple repair: look for lines starting with '{' to '}'
  if (!parsed) {
    try {
      const start = typeof llmRespText === 'string' ? llmRespText.indexOf('{') : -1;
      const end = typeof llmRespText === 'string' ? llmRespText.lastIndexOf('}') : -1;
      if (typeof start === 'number' && typeof end === 'number' && start !== -1 && end !== -1 && start < end) {
        parsed = JSON.parse(llmRespText!.slice(start, end + 1));
      }
    } catch (err) {
      parsed = null;
    }
  }

  if (!parsed) {
    // If this was a refine request and parsing failed, fall back to the provided plan if available
    if (isRefine && body.plan) {
      const fallbackPlan = { ...body.plan, metadata: { ...(body.plan.metadata || {}), refined_by: 'llm-parse-failed-fallback' } };
      const validation2 = validateEditPlan(fallbackPlan);
      if (validation2.valid) {
        return jsonResponse({ plan: validation2.data });
      }
    }

    const heuristicPlan = createHeuristicEditPlan(body.clips || []);
    const validation2 = validateEditPlan(heuristicPlan);
    if (validation2.valid) {
      return jsonResponse({ plan: validation2.data });
    }

    return jsonResponse({ error: 'parse_failed', details: 'Could not extract JSON from LLM response', raw: llmRespText }, 502);
  }

  const validation = validateEditPlan(parsed);
  if (!validation.valid) {
    const repaired = { ...parsed };
    if (Array.isArray(repaired.actions)) {
      repaired.actions = repaired.actions.map((a: any, i: number) => ({
        id: a.id ?? `action-${i}`,
        type: ['cut', 'transition', 'effect', 'grade', 'text', 'speed'].includes(a.type) ? a.type : 'cut',
        params: a.params ?? {},
        start: typeof a.start === 'number' ? a.start : 0,
        end: typeof a.end === 'number' ? a.end : undefined,
      }));
    }
    if (Array.isArray(repaired.clips)) {
      repaired.clips = repaired.clips.map((c: any, i: number) => ({
        id: c.id ?? `clip-${i}`,
        filename: c.filename ?? `clip-${i}.mp4`,
        duration: typeof c.duration === 'number' ? c.duration : 1,
        start: typeof c.start === 'number' ? c.start : undefined,
        end: typeof c.end === 'number' ? c.end : undefined,
      }));
    }

    const secondValidation = validateEditPlan(repaired);
    if (!secondValidation.valid) {
      // If this was a successful refine attempt but validation still fails, return a helpful error
      return jsonResponse({ error: 'validation_failed', details: validation.details ?? secondValidation.details, raw_parsed: parsed }, 422);
    }
    // Add metadata indicating we repaired the plan
    const repairedWithMeta = { ...secondValidation.data, metadata: { ...(secondValidation.data.metadata || {}), repaired_by: 'auto-repair' } };
    return jsonResponse({ plan: repairedWithMeta });
  }

  // If this was a refine call, annotate metadata to indicate refinement source and timestamp
  const finalPlan = { ...validation.data };
  finalPlan.metadata = { ...(finalPlan.metadata || {}), refined_by: isRefine ? 'llm-refine' : finalPlan.metadata?.generated_by ?? 'llm' , refined_at: new Date().toISOString() };

  return jsonResponse({ plan: finalPlan });
};

function makeId(prefix = 'id') {
  try {
    return (globalThis as any).crypto?.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  }
}

function createHeuristicEditPlan(clips: any[]): any {
  const id = makeId('plan');
  const planClips = (clips || []).map((c: any, i: number) => ({ id: c.id ?? makeId('clip'), filename: c.filename ?? `clip-${i}.mp4`, duration: typeof c.duration === 'number' ? c.duration : 1, start: typeof c.start === 'number' ? c.start : 0, end: typeof c.end === 'number' ? c.end : undefined }));

  const actions: any[] = [];
  for (const clip of planClips) {
    const seg = Math.max(1, Math.round(clip.duration / 3));
    for (let t = 0; t < clip.duration; t += seg) {
      actions.push({ id: makeId('act'), type: 'cut', params: { clipId: clip.id }, start: t, end: Math.min(clip.duration, t + seg) });
    }
    // simple transition between clips
    actions.push({ id: makeId('act'), type: 'transition', params: { style: 'crossfade', duration: 0.3 }, start: 0 });
  }

  return { id, clips: planClips, actions, metadata: { generated_by: 'heuristic-fallback' } };
}
