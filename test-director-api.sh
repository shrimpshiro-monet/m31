#!/bin/bash

# AI Director API Test Suite
# Test different generation and refinement scenarios

BASE_URL="http://localhost:3000/api/director/generate"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 AI Director API Test Suite${NC}\n"

# Test 1: Basic generation with balanced style
echo -e "${YELLOW}Test 1: Generate balanced edit plan${NC}"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-1", "filename": "video.mp4", "duration": 30}],
    "style": "balanced"
  }' | jq '.plan | {id, generated_by: .metadata.generated_by, actions_count: (.actions | length), pacing: .metadata.before_stats.pacing}'
echo -e "${GREEN}✅ Test 1 complete\n${NC}"

# Test 2: Energetic style
echo -e "${YELLOW}Test 2: Generate energetic edit plan${NC}"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-2", "filename": "music-video.mp4", "duration": 45}],
    "style": "energetic"
  }' | jq '.plan | {id, generated_by: .metadata.generated_by, actions_count: (.actions | length), pacing: .metadata.before_stats.pacing}'
echo -e "${GREEN}✅ Test 2 complete\n${NC}"

# Test 3: Cinematic style
echo -e "${YELLOW}Test 3: Generate cinematic edit plan${NC}"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-3", "filename": "narrative.mp4", "duration": 60}],
    "style": "cinematic"
  }' | jq '.plan | {id, generated_by: .metadata.generated_by, actions_count: (.actions | length), pacing: .metadata.before_stats.pacing}'
echo -e "${GREEN}✅ Test 3 complete\n${NC}"

# Test 4: Refinement - make it faster
echo -e "${YELLOW}Test 4: Refine plan to be faster${NC}"
PLAN=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-4", "filename": "test.mp4", "duration": 30}],
    "style": "balanced"
  }' | jq '.plan')

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"clips\": [{\"id\": \"clip-4\", \"filename\": \"test.mp4\", \"duration\": 30}],
    \"action\": \"refine\",
    \"plan\": $PLAN,
    \"instruction\": \"Make it faster and more energetic like a trailer\"
  }" | jq '.plan.metadata | {refined_by, refinement_instruction, before_stats: .before_stats | {pacing, cutCount, avgCutDuration}, after_stats: .after_stats | {pacing, cutCount, avgCutDuration}}'
echo -e "${GREEN}✅ Test 4 complete\n${NC}"

# Test 5: Refinement - make it cinematic
echo -e "${YELLOW}Test 5: Refine plan to be cinematic${NC}"
PLAN=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-5", "filename": "test2.mp4", "duration": 30}],
    "style": "balanced"
  }' | jq '.plan')

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"clips\": [{\"id\": \"clip-5\", \"filename\": \"test2.mp4\", \"duration\": 30}],
    \"action\": \"refine\",
    \"plan\": $PLAN,
    \"instruction\": \"Make it cinematic and dramatic with long dissolves\"
  }" | jq '.plan.metadata | {refined_by, refinement_instruction, before_stats: .before_stats | {pacing, cutCount}, after_stats: .after_stats | {pacing, cutCount}}'
echo -e "${GREEN}✅ Test 5 complete\n${NC}"

# Test 6: Multiple clips
echo -e "${YELLOW}Test 6: Generate plan for multiple clips${NC}"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [
      {"id": "clip-a", "filename": "intro.mp4", "duration": 10},
      {"id": "clip-b", "filename": "main.mp4", "duration": 30},
      {"id": "clip-c", "filename": "outro.mp4", "duration": 10}
    ],
    "style": "balanced"
  }' | jq '.plan | {id, generated_by: .metadata.generated_by, total_clips: (.clips | length), total_actions: (.actions | length)}'
echo -e "${GREEN}✅ Test 6 complete\n${NC}"

# Test 7: Long video (120s)
echo -e "${YELLOW}Test 7: Generate plan for long video (120s)${NC}"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-long", "filename": "longform.mp4", "duration": 120}],
    "style": "balanced"
  }' | jq '.plan | {id, generated_by: .metadata.generated_by, duration: .metadata.total_duration, actions_count: (.actions | length)}'
echo -e "${GREEN}✅ Test 7 complete\n${NC}"

echo -e "${BLUE}🎉 All tests complete!${NC}"
