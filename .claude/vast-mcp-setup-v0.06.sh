#!/bin/bash
###############################################################################
# VAST.AI COMFYUI + DUAL MCP SETUP SCRIPT v0.06
# FULLY SELF-CONTAINED — installs ComfyUI from scratch, zero template dependency
# Works on any image with CUDA + Python (pytorch/pytorch recommended)
#
# ENDPOINTS:
#   ComfyUI MCP: https://mcp.comfyui-mcp.uk/mcp      (port 9000)
#   Shell MCP:   https://shell.comfyui-mcp.uk/mcp     (port 9001)
#
# CHANGELOG:
# v0.06 - SELF-CONTAINED: Installs ComfyUI from scratch, no template needed
#        - Uses pytorch/pytorch base image instead of ComfyUI template
#        - Installs ComfyUI + Manager + all dependencies
#        - Starts ComfyUI on port 18188 before MCP setup
#        - Fully automated, re-runnable, zero manual steps
# v0.05 - DUAL MCP: Shell MCP server (port 9001), multi-host tunnel
# v0.04 - Remove /.provisioning lock
# v0.03 - ComfyUI wait loop (5min)
# v0.02 - Added cloudflared install, refreshed cert.pem
# v0.01 - Initial version
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

RETRY_MAX=3
TUNNEL_ID="73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d"
TUNNEL_NAME="comfyui-mcp"
COMFYUI_DIR="/workspace/ComfyUI"
COMFYUI_PORT=18188
COMFYUI_MCP_PORT=9000
SHELL_MCP_PORT=9001
GITHUB_RAW="https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude"

step() { echo -e "\n${CYAN}${BOLD}[$1/$TOTAL] $2${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${CYAN}ℹ  $1${NC}"; }

TOTAL=13

echo -e "${BOLD}========================================================${NC}"
echo -e "${BOLD}  VAST.AI DUAL MCP SETUP v0.06 (SELF-CONTAINED)${NC}"
echo -e "${MAGENTA}${BOLD}  ComfyUI MCP: https://mcp.comfyui-mcp.uk/mcp${NC}"
echo -e "${MAGENTA}${BOLD}  Shell MCP:   https://shell.comfyui-mcp.uk/mcp${NC}"
echo -e "${BOLD}========================================================${NC}"
echo ""
echo -e "${CYAN}  This script installs EVERYTHING from scratch.${NC}"
echo -e "${CYAN}  No template required. Works on any CUDA image.${NC}"
echo ""

###############################################################################
# PRE-STEP: Remove provisioning lock if present
###############################################################################
[ -f "/.provisioning" ] && rm -f /.provisioning && info "Removed /.provisioning lock"

###############################################################################
step 1 "Installing system dependencies"
###############################################################################
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null
apt-get install -y -qq git aria2 wget curl ffmpeg libgl1-mesa-glx libglib2.0-0 \
    libsm6 libxrender1 libxext6 > /dev/null 2>&1
ok "System dependencies installed (git, aria2, ffmpeg, GL libs)"

###############################################################################
step 2 "Installing cloudflared"
###############################################################################
if command -v cloudflared &>/dev/null; then
    ok "cloudflared already installed"
else
    for i in $(seq 1 $RETRY_MAX); do
        curl -sL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb" -o /tmp/cloudflared.deb && \
        dpkg -i /tmp/cloudflared.deb > /dev/null 2>&1 && \
        rm -f /tmp/cloudflared.deb && break
        warn "Retry $i/$RETRY_MAX..."
        sleep 2
    done
    command -v cloudflared &>/dev/null && ok "cloudflared installed" || fail "Failed to install cloudflared"
fi

###############################################################################
step 3 "Installing ComfyUI"
###############################################################################
if [ -d "${COMFYUI_DIR}" ] && [ -f "${COMFYUI_DIR}/main.py" ]; then
    ok "ComfyUI already installed at ${COMFYUI_DIR}"
else
    info "Cloning ComfyUI..."
    mkdir -p /workspace
    cd /workspace
    for i in $(seq 1 $RETRY_MAX); do
        git clone https://github.com/comfyanonymous/ComfyUI.git && break
        warn "Retry $i/$RETRY_MAX..."
        rm -rf ComfyUI
        sleep 3
    done
    [ -d "${COMFYUI_DIR}/main.py" ] || [ -f "${COMFYUI_DIR}/main.py" ] && ok "ComfyUI cloned" || {
        # Check if clone succeeded but main.py check failed
        if [ -d "${COMFYUI_DIR}" ]; then
            ok "ComfyUI cloned"
        else
            fail "Failed to clone ComfyUI"
        fi
    }
fi

###############################################################################
step 4 "Installing ComfyUI Python dependencies"
###############################################################################
cd "${COMFYUI_DIR}"

# Install PyTorch if not already present (some images have it pre-installed)
python3 -c "import torch; print(f'PyTorch {torch.__version__} CUDA={torch.cuda.is_available()}')" 2>/dev/null && {
    ok "PyTorch already installed"
} || {
    info "Installing PyTorch with CUDA..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
        --break-system-packages > /dev/null 2>&1
    ok "PyTorch installed"
}

# Install ComfyUI requirements
info "Installing ComfyUI requirements..."
pip install -r requirements.txt --break-system-packages > /dev/null 2>&1
ok "ComfyUI requirements installed"

# Install numpy<2 to prevent onnxruntime conflicts
pip install "numpy<2" --break-system-packages > /dev/null 2>&1

###############################################################################
step 5 "Installing ComfyUI-Manager"
###############################################################################
MANAGER_DIR="${COMFYUI_DIR}/custom_nodes/ComfyUI-Manager"
if [ -d "${MANAGER_DIR}" ]; then
    ok "ComfyUI-Manager already installed"
else
    cd "${COMFYUI_DIR}/custom_nodes"
    for i in $(seq 1 $RETRY_MAX); do
        git clone https://github.com/ltdrdata/ComfyUI-Manager.git && break
        warn "Retry $i/$RETRY_MAX..."
        rm -rf ComfyUI-Manager
        sleep 3
    done
    [ -d "${MANAGER_DIR}" ] && ok "ComfyUI-Manager installed" || warn "ComfyUI-Manager install failed (non-fatal)"
fi

###############################################################################
step 6 "Starting ComfyUI"
###############################################################################
# Kill any existing ComfyUI process
pkill -f "main.py.*--listen" 2>/dev/null || true
sleep 2

cd "${COMFYUI_DIR}"
info "Starting ComfyUI on port ${COMFYUI_PORT}..."
nohup python3 main.py --listen 0.0.0.0 --port ${COMFYUI_PORT} --enable-cors-header > /tmp/comfyui.log 2>&1 &
COMFYUI_PID=$!
echo "ComfyUI PID: $COMFYUI_PID"

# Wait up to 5 minutes for ComfyUI to be ready
COMFY_READY=0
echo -n "Waiting for ComfyUI on port ${COMFYUI_PORT}..."
for i in $(seq 1 60); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 3 http://localhost:${COMFYUI_PORT} 2>/dev/null)
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "403" ]; then
        echo ""
        ok "ComfyUI is ready (HTTP $HTTP) — PID $COMFYUI_PID"
        COMFY_READY=1
        break
    fi
    echo -n "."
    sleep 5
done

if [ "$COMFY_READY" -eq 0 ]; then
    echo ""
    warn "ComfyUI not ready after 5 minutes — MCP will still be set up"
    warn "Check /tmp/comfyui.log for errors"
    warn "Last 5 lines:"
    tail -5 /tmp/comfyui.log 2>/dev/null || true
fi

###############################################################################
step 7 "Cloning + installing ComfyUI MCP server"
###############################################################################
if [ -d "/workspace/comfyui-mcp-server" ]; then
    ok "ComfyUI MCP server already cloned"
else
    for i in $(seq 1 $RETRY_MAX); do
        cd /workspace && git clone https://github.com/joenorton/comfyui-mcp-server.git && break
        warn "Retry $i/$RETRY_MAX..."
        rm -rf /workspace/comfyui-mcp-server
        sleep 2
    done
    [ -d "/workspace/comfyui-mcp-server" ] && ok "Cloned" || fail "Failed to clone ComfyUI MCP server"
fi

cd /workspace/comfyui-mcp-server
for i in $(seq 1 $RETRY_MAX); do
    pip install -r requirements.txt --break-system-packages > /dev/null 2>&1 && break
    warn "Retry $i/$RETRY_MAX..."
    sleep 2
done
ok "MCP server dependencies installed"

###############################################################################
step 8 "Patching DNS rebinding protection (ComfyUI MCP)"
###############################################################################
if grep -q "enable_dns_rebinding_protection=False" /workspace/comfyui-mcp-server/server.py; then
    ok "Already patched"
else
    python3 -c "
content = open('/workspace/comfyui-mcp-server/server.py').read()
old = '        mcp.run(transport=\"streamable-http\")'
new = '''        # Disable DNS rebinding protection for Cloudflare tunnel access
        from mcp.server.transport_security import TransportSecuritySettings
        mcp.settings.transport_security = TransportSecuritySettings(enable_dns_rebinding_protection=False)
        mcp.run(transport=\"streamable-http\")'''
content = content.replace(old, new)
open('/workspace/comfyui-mcp-server/server.py', 'w').write(content)
"
    ok "Patched server.py — DNS rebinding protection disabled"
fi

###############################################################################
step 9 "Installing Shell MCP server"
###############################################################################
SHELL_MCP_DIR="/workspace/shell-mcp-server"
SHELL_MCP_FILE="${SHELL_MCP_DIR}/server.py"

mkdir -p "${SHELL_MCP_DIR}"

echo "Downloading shell-mcp-server from GitHub..."
for i in $(seq 1 $RETRY_MAX); do
    curl -sL "${GITHUB_RAW}/shell-mcp-server-v0.01.py" -o "${SHELL_MCP_FILE}" && break
    warn "Retry $i/$RETRY_MAX..."
    sleep 2
done

if [ -f "${SHELL_MCP_FILE}" ] && [ -s "${SHELL_MCP_FILE}" ]; then
    chmod +x "${SHELL_MCP_FILE}"
    ok "Shell MCP server installed at ${SHELL_MCP_FILE}"
else
    fail "Failed to download shell-mcp-server"
fi

###############################################################################
step 10 "Writing Cloudflare tunnel credentials + config"
###############################################################################
mkdir -p /root/.cloudflared

# cert.pem (for DNS route management)
echo "LS0tLS1CRUdJTiBBUkdPIFRVTk5FTCBUT0tFTi0tLS0tCmV5SjZiMjVsU1VRaU9pSTFOemN6TVRkbFl6STFNamxsTnpsak5ERTNObVU1WWpJek9ETmpNVEU0TUNJc0ltRmoKWTI5MWJuUkpSQ0k2SW1Ka05XWmlZMlUyTW1NNU1UQTVaVFV5WmpBM1lqQTBZVGt6TkdVME1qQTFJaXdpWVhCcApWRzlyWlc0aU9pSlRNVTlJUm5wSE9WOWFjV0p2ZWtOcmFVSTRTVjlHVFZKdldrWmliM0V0WjJSWGVFVlBibEZ5CkluMD0KLS0tLS1FTkQgQVJHTyBUVU5ORUwgVE9LRU4tLS0tLQo=" | base64 -d > /root/.cloudflared/cert.pem
chmod 600 /root/.cloudflared/cert.pem

# Tunnel JSON credentials
cat > /root/.cloudflared/${TUNNEL_ID}.json << 'TUNNEL_EOF'
{"AccountTag":"bd5fbce62c9109e52f07b04a934e4205","TunnelSecret":"WMYTqK5pi5hmnf5tE07r8RMX+4lfQIni2C7JPKeyE64=","TunnelID":"73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d","Endpoint":""}
TUNNEL_EOF
chmod 600 /root/.cloudflared/${TUNNEL_ID}.json

# Multi-host tunnel config
cat > /root/.cloudflared/config.yml << CFGEOF
tunnel: ${TUNNEL_ID}
credentials-file: /root/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: shell.comfyui-mcp.uk
    service: http://localhost:${SHELL_MCP_PORT}
  - hostname: mcp.comfyui-mcp.uk
    service: http://localhost:${COMFYUI_MCP_PORT}
  - service: http_status:404
CFGEOF

ok "Tunnel credentials + multi-host config written"

# Add DNS route for shell.comfyui-mcp.uk (safe to re-run)
cloudflared tunnel route dns ${TUNNEL_NAME} shell.comfyui-mcp.uk 2>/dev/null && \
    ok "DNS route added: shell.comfyui-mcp.uk" || \
    info "DNS route already exists (OK)"

###############################################################################
step 11 "Starting ComfyUI MCP server"
###############################################################################
pkill -f "comfyui-mcp-server/server.py" 2>/dev/null || true
sleep 1

if [ "$COMFY_READY" -eq 1 ]; then
    COMFYUI_URL=http://localhost:${COMFYUI_PORT} nohup python /workspace/comfyui-mcp-server/server.py > /tmp/mcp-comfyui.log 2>&1 &
    COMFYUI_MCP_PID=$!
    echo "ComfyUI MCP server PID: $COMFYUI_MCP_PID"

    echo -n "Waiting for ComfyUI MCP server..."
    for i in $(seq 1 15); do
        sleep 2
        HTTP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:${COMFYUI_MCP_PORT}/mcp \
            -H "Content-Type: application/json" \
            -H "Accept: application/json, text/event-stream" \
            -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)
        if [ "$HTTP_CHECK" = "200" ]; then
            echo ""
            ok "ComfyUI MCP server ready on port ${COMFYUI_MCP_PORT}"
            break
        fi
        echo -n "."
        if [ "$i" -eq 15 ]; then
            echo ""
            warn "ComfyUI MCP not responding — check /tmp/mcp-comfyui.log"
        fi
    done
else
    warn "Skipping ComfyUI MCP start (ComfyUI not ready)"
    COMFYUI_MCP_PID="N/A"
fi

###############################################################################
step 12 "Starting Shell MCP server"
###############################################################################
pkill -f "shell-mcp-server/server.py" 2>/dev/null || true
sleep 1

nohup python ${SHELL_MCP_FILE} > /tmp/mcp-shell.log 2>&1 &
SHELL_MCP_PID=$!
echo "Shell MCP server PID: $SHELL_MCP_PID"

echo -n "Waiting for Shell MCP server..."
for i in $(seq 1 15); do
    sleep 2
    HTTP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:${SHELL_MCP_PORT}/mcp \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)
    if [ "$HTTP_CHECK" = "200" ]; then
        echo ""
        ok "Shell MCP server ready on port ${SHELL_MCP_PORT}"
        break
    fi
    echo -n "."
    if [ "$i" -eq 15 ]; then
        echo ""
        warn "Shell MCP not responding — check /tmp/mcp-shell.log"
    fi
done

###############################################################################
step 13 "Starting Cloudflare tunnel (dual endpoint)"
###############################################################################
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

nohup cloudflared tunnel run ${TUNNEL_NAME} > /tmp/cloudflared.log 2>&1 &
CF_PID=$!
echo "Cloudflared PID: $CF_PID"

echo -n "Waiting for tunnel..."
for i in $(seq 1 15); do
    sleep 2
    if grep -q "Registered tunnel connection" /tmp/cloudflared.log 2>/dev/null; then
        echo ""
        ok "Tunnel connected"
        break
    fi
    echo -n "."
    if [ "$i" -eq 15 ]; then
        echo ""
        warn "Tunnel not registered after 30s — check /tmp/cloudflared.log"
    fi
done

# Verify both endpoints
sleep 3
COMFYUI_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST https://mcp.comfyui-mcp.uk/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

SHELL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST https://shell.comfyui-mcp.uk/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

echo ""
echo -e "${BOLD}========================================================${NC}"
echo -e "${BOLD}  VAST.AI DUAL MCP SETUP v0.06 — RESULTS${NC}"
echo -e "${BOLD}========================================================${NC}"

if [ "$COMFYUI_HTTP" = "200" ]; then
    echo -e "${GREEN}${BOLD}  ✅ ComfyUI MCP:  https://mcp.comfyui-mcp.uk/mcp   [${COMFYUI_HTTP}]${NC}"
else
    echo -e "${YELLOW}${BOLD}  ⚠️  ComfyUI MCP:  https://mcp.comfyui-mcp.uk/mcp   [${COMFYUI_HTTP}]${NC}"
fi

if [ "$SHELL_HTTP" = "200" ]; then
    echo -e "${GREEN}${BOLD}  ✅ Shell MCP:    https://shell.comfyui-mcp.uk/mcp  [${SHELL_HTTP}]${NC}"
else
    echo -e "${YELLOW}${BOLD}  ⚠️  Shell MCP:    https://shell.comfyui-mcp.uk/mcp  [${SHELL_HTTP}]${NC}"
fi

echo -e "${BOLD}  ────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}  ComfyUI PID:     ${COMFYUI_PID:-N/A}${NC}"
echo -e "${BOLD}  ComfyUI MCP PID: ${COMFYUI_MCP_PID:-N/A}${NC}"
echo -e "${BOLD}  Shell MCP PID:   ${SHELL_MCP_PID}${NC}"
echo -e "${BOLD}  Cloudflared PID: ${CF_PID}${NC}"
echo -e "${BOLD}========================================================${NC}"

echo ""
echo -e "${CYAN}  Logs:${NC}"
echo -e "${CYAN}    ComfyUI:     /tmp/comfyui.log${NC}"
echo -e "${CYAN}    ComfyUI MCP: /tmp/mcp-comfyui.log${NC}"
echo -e "${CYAN}    Shell MCP:   /tmp/mcp-shell.log${NC}"
echo -e "${CYAN}    Tunnel:      /tmp/cloudflared.log${NC}"
echo ""
echo -e "${GREEN}${BOLD}  v0.06 setup complete. No template required.${NC}"
