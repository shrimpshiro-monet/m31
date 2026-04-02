#!/bin/bash

# AI Director - Dynamic Prompt Testing CLI
# Use this to test custom prompts and different editing styles

BASE_URL="http://localhost:3000/api/director"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Test 1: Custom aggressive prompt
test_custom_aggressive() {
  print_header "Test 1: Custom Aggressive Music Video Prompt"
  
  CUSTOM_PROMPT="You are editing a high-energy music video for an EDM track. 
  
Use techniques:
- Fast, rhythmic cuts on beat
- Dramatic zoom transitions
- Fast flashes between scenes
- Color grading that's bold and saturated
- Heavy use of effects to emphasize musical peaks

Create an EditPlan that feels visceral and energetic, synced to intense music."

  curl -s -X POST "$BASE_URL/generate-custom" \
    -H "Content-Type: application/json" \
    -d "{
      \"clips\": [{\"id\": \"clip-1\", \"filename\": \"music-video.mp4\", \"duration\": 30}],
      \"customPrompt\": \"$(echo "$CUSTOM_PROMPT" | sed 's/"/\\"/g')\"
    }" | jq '.plan | {id, generated_by: .metadata.generated_by, actions: (.actions | length), types: (.actions | map(.type) | unique)}'
  
  print_success "Custom aggressive prompt tested\n"
}

# Test 2: Custom documentary prompt
test_custom_documentary() {
  print_header "Test 2: Custom Documentary Prompt"
  
  CUSTOM_PROMPT="You are editing a nature documentary about wildlife.

Use techniques:
- Long, observational cuts to show natural behavior
- Subtle dissolve transitions
- Match cuts between related shots
- Minimal effects to avoid distraction
- Pacing that feels natural and contemplative

Create an EditPlan that's beautiful, clear, and respects the subject matter."

  curl -s -X POST "$BASE_URL/generate-custom" \
    -H "Content-Type: application/json" \
    -d "{
      \"clips\": [{\"id\": \"clip-1\", \"filename\": \"nature.mp4\", \"duration\": 45}],
      \"customPrompt\": \"$(echo "$CUSTOM_PROMPT" | sed 's/"/\\"/g')\"
    }" | jq '.plan | {id, generated_by: .metadata.generated_by, actions: (.actions | length), types: (.actions | map(.type) | unique)}'
  
  print_success "Custom documentary prompt tested\n"
}

# Test 3: Custom commercial prompt
test_custom_commercial() {
  print_header "Test 3: Custom Commercial Prompt"
  
  CUSTOM_PROMPT="You are editing a 30-second commercial for a luxury brand.

Use techniques:
- Smooth, sophisticated transitions
- High-quality color grading with premium LUTs
- Strategic timing to product reveals
- Elegant effects that add value
- Pacing that builds to a climactic product moment

Create an EditPlan that feels premium, aspirational, and memorable."

  curl -s -X POST "$BASE_URL/generate-custom" \
    -H "Content-Type: application/json" \
    -d "{
      \"clips\": [{\"id\": \"clip-1\", \"filename\": \"product.mp4\", \"duration\": 30}],
      \"customPrompt\": \"$(echo "$CUSTOM_PROMPT" | sed 's/"/\\"/g')\"
    }" | jq '.plan | {id, generated_by: .metadata.generated_by, actions: (.actions | length), types: (.actions | map(.type) | unique)}'
  
  print_success "Custom commercial prompt tested\n"
}

# Test 4: Custom comedy/vlog prompt
test_custom_vlog() {
  print_header "Test 4: Custom Comedy Vlog Prompt"
  
  CUSTOM_PROMPT="You are editing a comedy/vlog video for social media.

Use techniques:
- Quick, punchy cuts for comedic timing
- Meme-style transitions and effects
- Jump cuts for emphasis on jokes
- Trend-appropriate visual effects
- Fast pacing with strategic slow-mo moments
- Text overlays and visual humor support

Create an EditPlan that's entertaining, shareable, and maximizes engagement."

  curl -s -X POST "$BASE_URL/generate-custom" \
    -H "Content-Type: application/json" \
    -d "{
      \"clips\": [{\"id\": \"clip-1\", \"filename\": \"comedy.mp4\", \"duration\": 60}],
      \"customPrompt\": \"$(echo "$CUSTOM_PROMPT" | sed 's/"/\\"/g')\"
    }" | jq '.plan | {id, generated_by: .metadata.generated_by, actions: (.actions | length), types: (.actions | map(.type) | unique)}'
  
  print_success "Custom vlog prompt tested\n"
}

# Test 5: Custom film trailer
test_custom_trailer() {
  print_header "Test 5: Custom Film Trailer Prompt"
  
  CUSTOM_PROMPT="You are editing a dramatic film trailer.

Use techniques:
- Dynamic cuts synchronized with music/audio beats
- Tension-building pacing
- Match cuts between thematically related shots
- Dramatic effects (zoom in, flash frames)
- Sound-synchronized cuts for impact
- Building intensity throughout
- Climactic moment punctuation

Create an EditPlan that builds excitement and intrigue."

  curl -s -X POST "$BASE_URL/generate-custom" \
    -H "Content-Type: application/json" \
    -d "{
      \"clips\": [{\"id\": \"clip-1\", \"filename\": \"trailer.mp4\", \"duration\": 120}],
      \"customPrompt\": \"$(echo "$CUSTOM_PROMPT" | sed 's/"/\\"/g')\"
    }" | jq '.plan | {id, generated_by: .metadata.generated_by, actions: (.actions | length), types: (.actions | map(.type) | unique)}'
  
  print_success "Custom trailer prompt tested\n"
}

# Main menu
show_menu() {
  echo -e "${CYAN}AI Director - Dynamic Prompt Test Suite${NC}\n"
  echo "Select a test:"
  echo "  1) Custom Aggressive Music Video"
  echo "  2) Custom Documentary"
  echo "  3) Custom Commercial"
  echo "  4) Custom Comedy Vlog"
  echo "  5) Custom Film Trailer"
  echo "  6) Run All Tests"
  echo "  q) Quit"
  echo ""
  read -p "Enter choice: " choice
}

run_all() {
  test_custom_aggressive
  test_custom_documentary
  test_custom_commercial
  test_custom_vlog
  test_custom_trailer
  print_header "All tests complete! 🎉"
}

# Main loop
while true; do
  show_menu
  case $choice in
    1) test_custom_aggressive ;;
    2) test_custom_documentary ;;
    3) test_custom_commercial ;;
    4) test_custom_vlog ;;
    5) test_custom_trailer ;;
    6) run_all ;;
    q) echo "Goodbye!"; exit 0 ;;
    *) print_error "Invalid choice" ;;
  esac
done
