#!/bin/bash
# ============================================================
#  COMFYUI MCP RECOVERY SCRIPT v0.01
#  Gets you back to exactly where we were: 2026-02-01
#  
#  State captured:
#    - A100 SXM4 80GB instance
#    - ComfyUI + both MCPs running via supervisord
#    - Cloudflare tunnel live (mcp.comfyui-mcp.uk + shell.comfyui-mcp.uk)
#    - RealVisXL_V5.0_Lightning loaded
#    - DNS rebinding patched
#    - tunnel_manager killed
#    - Both MCPs returning 200 through tunnel
#
#  Usage:
#    Step 1: Create instance (run from Claude or paste in browser console)
#    Step 2: Wait ~4 minutes
#    Step 3: Both MCPs live, start new Claude chat
# ============================================================

set -e

# ── Tokens ──
VAST_TOKEN="339786fe805ebc1c56f2b44bcec4b82aa0bf9f52247af363ff4711783b96e926"
VAST_API="https://console.vast.ai/api/v0"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${CYAN}ℹ  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo -e "${CYAN}"
echo "========================================================"
echo "  COMFYUI MCP — FULL RECOVERY"
echo "  Finding best GPU and launching instance..."
echo "========================================================"
echo -e "${NC}"

# ── Step 1: Find best available GPU ──
info "Searching for GPU (budget: \$1/hr, min 24GB VRAM, min 500Mbps)..."

OFFERS=$(curl -s -H "Authorization: Bearer $VAST_TOKEN" \
  "$VAST_API/bundles?q=$(python3 -c "import urllib.parse,json; print(urllib.parse.quote(json.dumps({
    'rentable':{'eq':True},
    'dph_total':{'lte':1.0},
    'gpu_ram':{'gte':24},
    'inet_down':{'gte':500},
    'reliability2':{'gte':0.95},
    'num_gpus':{'eq':1},
    'order':[['dph_total','asc']]
  })))")&limit=5")

# Parse best offer
OFFER_ID=$(echo "$OFFERS" | python3 -c "
import sys,json
data = json.load(sys.stdin)
offers = data.get('offers', data) if isinstance(data, dict) else data
if not offers:
    print('NONE')
else:
    best = offers[0]
    print(best['id'])
    import sys as s
    s.stderr.write(f\"  GPU: {best.get('gpu_name','?')} {best.get('gpu_ram','?')}GB | \${best.get('dph_total',0):.2f}/hr | {best.get('inet_down',0):.0f}Mbps | {best.get('geolocation','?')}\n\")
" 2>&1)

if [ "$OFFER_ID" = "NONE" ]; then
    fail "No GPUs available matching criteria. Try again in a few minutes."
fi

# Extract just the ID (first line) and info (second line)  
GPU_INFO=$(echo "$OFFER_ID" | tail -1)
OFFER_ID=$(echo "$OFFER_ID" | head -1)

info "Best offer: $GPU_INFO"
info "Offer ID: $OFFER_ID"

# ── Step 2: Create instance ──
info "Creating instance with ComfyUI template + auto-provisioning..."

RESULT=$(curl -s -X PUT -H "Authorization: Bearer $VAST_TOKEN" \
  -H "Content-Type: application/json" \
  "$VAST_API/asks/$OFFER_ID/" \
  -d "{
    \"client_id\": \"me\",
    \"image\": \"vastai/comfy:v0.10.0-cuda-12.9-py312\",
    \"disk\": 80,
    \"runtype\": \"jupyter_direct\",
    \"onstart\": \"curl -sL https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude/vast-mcp-setup-v0.07.sh | bash\"
  }")

INSTANCE_ID=$(echo "$RESULT" | python3 -c "
import sys,json
d = json.load(sys.stdin)
if 'new_contract' in d:
    print(d['new_contract'])
elif 'id' in d:
    print(d['id'])
else:
    print('FAILED')
    import sys as s
    s.stderr.write(str(d) + '\n')
" 2>&1)

if [ "$INSTANCE_ID" = "FAILED" ]; then
    fail "Instance creation failed. Response: $RESULT"
fi

ok "Instance created: $INSTANCE_ID"

# ── Step 3: Wait for instance to boot ──
info "Waiting for instance to boot and provision (this takes ~4 minutes)..."

for i in $(seq 1 60); do
    STATUS=$(curl -s -H "Authorization: Bearer $VAST_TOKEN" \
      "$VAST_API/instances/$INSTANCE_ID" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(d.get('actual_status','unknown'))
" 2>/dev/null)
    
    if [ "$STATUS" = "running" ]; then
        ok "Instance is running!"
        break
    fi
    
    if [ $i -eq 60 ]; then
        warn "Instance still not running after 5 minutes. Check Vast.ai dashboard."
        warn "Instance ID: $INSTANCE_ID"
        exit 1
    fi
    
    printf "  Waiting... (%ds) Status: %s\r" $((i*5)) "$STATUS"
    sleep 5
done

# ── Step 4: Wait for MCP endpoints ──
info "Instance running. Waiting for MCP endpoints to come online..."

for i in $(seq 1 36); do
    COMFY_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 5 -X POST \
      https://mcp.comfyui-mcp.uk/mcp \
      -H "Content-Type: application/json" \
      -H "Accept: application/json, text/event-stream" \
      -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)
    
    SHELL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 5 -X POST \
      https://shell.comfyui-mcp.uk/mcp \
      -H "Content-Type: application/json" \
      -H "Accept: application/json, text/event-stream" \
      -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)
    
    if [ "$COMFY_HTTP" = "200" ] && [ "$SHELL_HTTP" = "200" ]; then
        break
    fi
    
    printf "  Waiting... (%ds) ComfyUI MCP: %s | Shell MCP: %s\r" $((i*5)) "$COMFY_HTTP" "$SHELL_HTTP"
    sleep 5
done

echo ""
echo -e "${CYAN}"
echo "========================================================"
echo "  RECOVERY COMPLETE"
echo "========================================================"

if [ "$COMFY_HTTP" = "200" ] && [ "$SHELL_HTTP" = "200" ]; then
    echo -e "  ${GREEN}✅ ComfyUI MCP:  https://mcp.comfyui-mcp.uk/mcp   [200]${NC}"
    echo -e "  ${GREEN}✅ Shell MCP:    https://shell.comfyui-mcp.uk/mcp  [200]${NC}"
else
    echo -e "  ComfyUI MCP:  https://mcp.comfyui-mcp.uk/mcp   [$COMFY_HTTP]"
    echo -e "  Shell MCP:    https://shell.comfyui-mcp.uk/mcp  [$SHELL_HTTP]"
    echo ""
    echo -e "  ${YELLOW}⚠️  Not all endpoints responding yet. Give it another minute.${NC}"
fi

echo ""
echo "  Instance ID: $INSTANCE_ID"
echo "  Vast Dashboard: https://cloud.vast.ai/instances/"
echo ""
echo "  Next: Start a new Claude chat in the ComfyUI project."
echo "        Both MCP toolsets will auto-load."
echo -e "${NC}"
echo "========================================================"
