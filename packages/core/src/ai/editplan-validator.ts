import Ajv, { Options } from 'ajv';
import addFormats from 'ajv-formats';
import { editPlanAjvSchema, EditPlan } from '../monetAgentConfig';

const options: Options = { allErrors: true };
const ajv = new Ajv(options);
addFormats(ajv as any);

const validate = ajv.compile(editPlanAjvSchema as any);

export function validateEditPlan(raw: unknown): { valid: true; data: EditPlan } | { valid: false; error: string; details?: any } {
  try {
    const ok = validate(raw as any);
    if (ok) {
      return { valid: true, data: raw as EditPlan };
    }
    return { valid: false, error: 'validation_failed', details: validate.errors };
  } catch (err) {
    return { valid: false, error: 'validator_error', details: err instanceof Error ? err.message : err };
  }
}

export default validateEditPlan;
