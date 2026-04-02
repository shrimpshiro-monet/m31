#!/bin/bash

# Simple test for dynamic custom prompts

echo "Testing dynamic prompt system..."
echo ""

# Test 1: Music Video
echo "=== Test 1: High-Energy Music Video ==="
curl -s -X POST "http://localhost:3000/api/director/generate-custom" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "clips": [{"id": "clip-1", "filename": "music.mp4", "duration": 30}],
  "customPrompt": "You are editing a high-energy electronic music video. Use fast rhythmic cuts synchronized with beats. Add dramatic zoom transitions and flash effects. Emphasize musical peaks with visual intensity. Create visceral energy."
}
EOF

echo ""
echo ""

# Test 2: Documentary
echo "=== Test 2: Contemplative Documentary ==="
curl -s -X POST "http://localhost:3000/api/director/generate-custom" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "clips": [{"id": "clip-1", "filename": "nature.mp4", "duration": 45}],
  "customPrompt": "You are editing a nature documentary. Use long, observational cuts. Employ subtle dissolve transitions. Match cuts between related shots. Minimal effects. Pacing should feel natural and contemplative, allowing viewers to absorb the content."
}
EOF

echo ""
echo ""

# Test 3: Commercial
echo "=== Test 3: Luxury Commercial ==="
curl -s -X POST "http://localhost:3000/api/director/generate-custom" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "clips": [{"id": "clip-1", "filename": "product.mp4", "duration": 30}],
  "customPrompt": "You are editing a luxury brand commercial. Use smooth, sophisticated transitions. Apply premium color grading. Build pacing strategically to product reveal moments. Use elegant effects that enhance perceived value. Create aspirational feeling."
}
EOF
