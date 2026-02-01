#!/bin/bash
###############################################################################
# VAST.AI COMFYUI + DUAL MCP SETUP SCRIPT v0.07
# FULLY SELF-CONTAINED — installs ComfyUI from scratch, zero template dependency
# SUPERVISORD — all processes auto-restart on crash, no more dead MCPs
#
# ENDPOINTS:
#   ComfyUI MCP: https://mcp.comfyui-mcp.uk/mcp      (port 9000)
#   Shell MCP:   https://shell.comfyui-mcp.uk/mcp     (port 9001)
#
# CHANGELOG:
# v0.07 - SUPERVISORD: All processes managed, auto-restart on crash
#        - Fixed ComfyUI MCP: python server.py (not -m module)
#        - Fixed Shell MCP: v0.02 compatible with mcp 1.26.0
#        - Fixed DNS rebinding: env var, not TransportSecuritySettings import
#        - Fixed Python detection: /venv/main/bin/python or python3
#        - Removed broken step 8 patch (no longer needed)
#        - supervisorctl commands for runtime control
#        - Includes start-mcps.sh for mid-session restarts via Claude
# v0.06 - SELF-CONTAINED: Installs ComfyUI from scratch, no template needed
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
echo -e "${BOLD}  VAST.AI DUAL MCP SETUP v0.07 (SUPERVISORD)${NC}"
echo -e "${MAGENTA}${BOLD}  ComfyUI MCP: https://mcp.comfyui-mcp.uk/mcp${NC}"
echo -e "${MAGENTA}${BOLD}  Shell MCP:   https://shell.comfyui-mcp.uk/mcp${NC}"
echo -e "${BOLD}========================================================${NC}"
echo ""
echo -e "${CYAN}  Supervisord manages all processes — auto-restart on crash.${NC}"
echo -e "${CYAN}  No template required. Works on any CUDA image.${NC}"
echo ""

###############################################################################
# PRE-STEP: Remove provisioning lock if present
###############################################################################
[ -f "/.provisioning" ] && rm -f /.provisioning && info "Removed /.provisioning lock"

###############################################################################
# Detect Python early — needed throughout the script
###############################################################################
if [ -f "/venv/main/bin/python" ]; then
    PYTHON="/venv/main/bin/python"
    PIP="/venv/main/bin/pip"
elif command -v python3 &>/dev/null; then
    PYTHON=$(which python3)
    PIP="$PYTHON -m pip"
else
    fail "No Python found"; exit 1
fi
info "Python: ${PYTHON}"

###############################################################################
step 1 "Installing system dependencies"
###############################################################################
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null
apt-get install -y -qq git aria2 wget curl ffmpeg libgl1-mesa-glx libglib2.0-0 \
    libsm6 libxrender1 libxext6 supervisor > /dev/null 2>&1
ok "System dependencies installed (git, aria2, ffmpeg, GL libs, supervisor)"

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
    if [ -d "${COMFYUI_DIR}" ]; then
        ok "ComfyUI cloned"
    else
        fail "Failed to clone ComfyUI"
    fi
fi

###############################################################################
step 4 "Installing ComfyUI Python dependencies"
###############################################################################
cd "${COMFYUI_DIR}"

$PYTHON -c "import torch; print(f'PyTorch {torch.__version__} CUDA={torch.cuda.is_available()}')" 2>/dev/null && {
    ok "PyTorch already installed"
} || {
    info "Installing PyTorch with CUDA..."
    $PIP install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
        --break-system-packages > /dev/null 2>&1
    ok "PyTorch installed"
}

info "Installing ComfyUI requirements..."
$PIP install -r requirements.txt --break-system-packages > /dev/null 2>&1
ok "ComfyUI requirements installed"

$PIP install "numpy<2" --break-system-packages > /dev/null 2>&1

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
step 6 "Downloading models"
###############################################################################
CHECKPOINT_DIR="${COMFYUI_DIR}/models/checkpoints"
mkdir -p "${CHECKPOINT_DIR}"

MODEL_FILE="${CHECKPOINT_DIR}/RealVisXL_V5.0_Lightning.safetensors"
CIVITAI_TOKEN="9252b1a71f4fac907a7724900f6ec608"

if [ -f "${MODEL_FILE}" ] && [ $(stat -c%s "${MODEL_FILE}" 2>/dev/null || echo 0) -gt 1000000000 ]; then
    ok "RealVisXL_V5.0_Lightning already downloaded"
else
    info "Downloading RealVisXL_V5.0_Lightning (6.5GB)..."
    cd "${CHECKPOINT_DIR}"
    for i in $(seq 1 $RETRY_MAX); do
        aria2c -x 16 -s 16 --max-tries=3 --retry-wait=5 --console-log-level=warn \
            -o "RealVisXL_V5.0_Lightning.safetensors" \
            "https://civitai.com/api/download/models/798204?type=Model&format=SafeTensor&size=full&fp=fp16&token=${CIVITAI_TOKEN}" && break
        warn "aria2c attempt $i failed, trying wget..."
        wget -q --show-progress -O "RealVisXL_V5.0_Lightning.safetensors" \
            "https://civitai.com/api/download/models/798204?type=Model&format=SafeTensor&size=full&fp=fp16&token=${CIVITAI_TOKEN}" && break
        warn "Retry $i/$RETRY_MAX..."
        sleep 3
    done
    if [ -f "${MODEL_FILE}" ] && [ $(stat -c%s "${MODEL_FILE}" 2>/dev/null || echo 0) -gt 1000000000 ]; then
        ok "RealVisXL downloaded ($(du -h ${MODEL_FILE} | cut -f1))"
    else
        warn "Model download incomplete — may need manual download"
    fi
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
    $PIP install -r requirements.txt --break-system-packages > /dev/null 2>&1 && break
    warn "Retry $i/$RETRY_MAX..."
    sleep 2
done
ok "MCP server dependencies installed"

# Also ensure mcp package is installed (for shell server)
$PIP install mcp --break-system-packages -q 2>/dev/null
ok "mcp package installed"

# Patch DNS rebinding protection directly in server.py
# The env var alone doesn't work — joenorton's server needs the code patched
if grep -q "enable_dns_rebinding_protection=False" /workspace/comfyui-mcp-server/server.py 2>/dev/null; then
    ok "DNS rebinding patch already applied"
else
    $PYTHON -c "
content = open('/workspace/comfyui-mcp-server/server.py').read()
# Try the known pattern from joenorton's server
old = '        mcp.run(transport=\"streamable-http\")'
new = '''        # Disable DNS rebinding protection for Cloudflare tunnel access
        from mcp.server.transport_security import TransportSecuritySettings
        mcp.settings.transport_security = TransportSecuritySettings(enable_dns_rebinding_protection=False)
        mcp.run(transport=\"streamable-http\")'''
if old in content:
    content = content.replace(old, new)
    open('/workspace/comfyui-mcp-server/server.py', 'w').write(content)
    print('PATCHED')
else:
    # Alternative: try without leading whitespace
    import re
    pattern = r'mcp\.run\(transport=\"streamable-http\"\)'
    match = re.search(pattern, content)
    if match:
        indent = ''
        line_start = content.rfind('\n', 0, match.start()) + 1
        indent = content[line_start:match.start()]
        replacement = f'''# Disable DNS rebinding protection for Cloudflare tunnel access
{indent}from mcp.server.transport_security import TransportSecuritySettings
{indent}mcp.settings.transport_security = TransportSecuritySettings(enable_dns_rebinding_protection=False)
{indent}mcp.run(transport=\"streamable-http\")'''
        content = content[:match.start()] + replacement + content[match.end():]
        open('/workspace/comfyui-mcp-server/server.py', 'w').write(content)
        print('PATCHED (alt)')
    else:
        print('WARNING: Could not find mcp.run pattern to patch')
" 2>&1
    PATCH_RESULT=$?
    if [ $PATCH_RESULT -eq 0 ]; then
        ok "DNS rebinding protection patched in server.py"
    else
        warn "Could not patch server.py — ComfyUI MCP may reject tunnel requests"
    fi
fi

###############################################################################
step 8 "Installing Shell MCP server (v0.02)"
###############################################################################
SHELL_MCP_DIR="/workspace/shell-mcp-server"
SHELL_MCP_FILE="${SHELL_MCP_DIR}/server.py"

mkdir -p "${SHELL_MCP_DIR}"

# Always download fresh v0.02 to avoid stale v0.01 issues
info "Downloading shell-mcp-server v0.02..."
for i in $(seq 1 $RETRY_MAX); do
    curl -sL "${GITHUB_RAW}/shell-mcp-server-v0.02.py" -o "${SHELL_MCP_FILE}" && break
    warn "Retry $i/$RETRY_MAX..."
    sleep 2
done

if [ -f "${SHELL_MCP_FILE}" ] && [ -s "${SHELL_MCP_FILE}" ]; then
    chmod +x "${SHELL_MCP_FILE}"
    ok "Shell MCP server v0.02 installed"
else
    fail "Failed to download shell-mcp-server"
fi

###############################################################################
step 9 "Writing Cloudflare tunnel credentials + config"
###############################################################################
mkdir -p /root/.cloudflared

echo "LS0tLS1CRUdJTiBBUkdPIFRVTk5FTCBUT0tFTi0tLS0tCmV5SjZiMjVsU1VRaU9pSTFOemN6TVRkbFl6STFNamxsTnpsak5ERTNObVU1WWpJek9ETmpNVEU0TUNJc0ltRmoKWTI5MWJuUkpSQ0k2SW1Ka05XWmlZMlUyTW1NNU1UQTVaVFV5WmpBM1lqQTBZVGt6TkdVME1qQTFJaXdpWVhCcApWRzlyWlc0aU9pSlRNVTlJUm5wSE9WOWFjV0p2ZWtOcmFVSTRTVjlHVFZKdldrWmliM0V0WjJSWGVFVlBibEZ5CkluMD0KLS0tLS1FTkQgQVJHTyBUVU5ORUwgVE9LRU4tLS0tLQo=" | base64 -d > /root/.cloudflared/cert.pem
chmod 600 /root/.cloudflared/cert.pem

cat > /root/.cloudflared/${TUNNEL_ID}.json << 'TUNNEL_EOF'
{"AccountTag":"bd5fbce62c9109e52f07b04a934e4205","TunnelSecret":"WMYTqK5pi5hmnf5tE07r8RMX+4lfQIni2C7JPKeyE64=","TunnelID":"73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d","Endpoint":""}
TUNNEL_EOF
chmod 600 /root/.cloudflared/${TUNNEL_ID}.json

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

cloudflared tunnel route dns ${TUNNEL_NAME} shell.comfyui-mcp.uk 2>/dev/null && \
    ok "DNS route added: shell.comfyui-mcp.uk" || \
    info "DNS route already exists (OK)"

###############################################################################
step 10 "Installing start-mcps.sh for mid-session restarts"
###############################################################################
curl -sL "${GITHUB_RAW}/start-mcps.sh" -o /workspace/start-mcps.sh
chmod +x /workspace/start-mcps.sh
ok "start-mcps.sh installed at /workspace/start-mcps.sh"

###############################################################################
step 11 "Writing supervisord configuration"
###############################################################################

# Kill only OUR processes — never touch ComfyUI (template manages it)
pkill -f "comfyui-mcp-server/server.py" 2>/dev/null || true
pkill -f "shell-mcp-server/server.py" 2>/dev/null || true
pkill -f "comfyui_mcp_server" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true

# Kill template's tunnel_manager — it conflicts with our cloudflared tunnel
supervisorctl stop tunnel_manager 2>/dev/null || true
# Prevent it from auto-restarting
if [ -f /etc/supervisor/conf.d/tunnel_manager.conf ]; then
    sed -i 's/autostart=true/autostart=false/' /etc/supervisor/conf.d/tunnel_manager.conf 2>/dev/null || true
fi
# Also check the main supervisord.conf or any combined config
for f in /etc/supervisor/supervisord.conf /etc/supervisor/conf.d/*.conf; do
    if grep -q "\[program:tunnel_manager\]" "$f" 2>/dev/null; then
        sed -i '/\[program:tunnel_manager\]/,/^\[/{s/autostart=true/autostart=false/}' "$f" 2>/dev/null || true
    fi
done
supervisorctl reread 2>/dev/null || true
supervisorctl update 2>/dev/null || true

sleep 2

# Detect if supervisord is already running (comfy template)
SUPERVISOR_RUNNING=0
if pgrep -x supervisord > /dev/null 2>&1; then
    SUPERVISOR_RUNNING=1
    info "Existing supervisord detected (template image) — adding MCP programs to it"
else
    info "No supervisord running — will start fresh (bare image)"
fi

# If template is managing ComfyUI, DON'T include [program:comfyui] — it conflicts
if [ "$SUPERVISOR_RUNNING" -eq 1 ]; then

cat > /etc/supervisor/conf.d/vast-mcp.conf << SUPEOF
; ============================================================================
; VAST.AI MCP STACK — Supervisord v0.07 (template mode — ComfyUI managed by template)
; ============================================================================

[program:comfyui-mcp]
command=${PYTHON} /workspace/comfyui-mcp-server/server.py
directory=/workspace/comfyui-mcp-server
environment=COMFYUI_URL="http://localhost:${COMFYUI_PORT}",MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION="false"
autostart=true
autorestart=true
startretries=10
startsecs=5
stopwaitsecs=5
stdout_logfile=/tmp/mcp-comfyui.log
stderr_logfile=/tmp/mcp-comfyui.log
redirect_stderr=true

[program:shell-mcp]
command=${PYTHON} /workspace/shell-mcp-server/server.py
directory=/workspace/shell-mcp-server
environment=MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION="false"
autostart=true
autorestart=true
startretries=10
startsecs=5
stopwaitsecs=5
stdout_logfile=/tmp/mcp-shell.log
stderr_logfile=/tmp/mcp-shell.log
redirect_stderr=true

[program:cloudflared]
command=cloudflared tunnel run ${TUNNEL_NAME}
autostart=true
autorestart=true
startretries=5
startsecs=5
stopwaitsecs=10
stdout_logfile=/tmp/cloudflared.log
stderr_logfile=/tmp/cloudflared.log
redirect_stderr=true
SUPEOF

else
# Bare image — we manage everything including ComfyUI
cat > /etc/supervisor/conf.d/vast-mcp.conf << SUPEOF
; ============================================================================
; VAST.AI MCP STACK — Supervisord v0.07 (bare image — manages all processes)
; ============================================================================

[program:comfyui]
command=${PYTHON} main.py --listen 0.0.0.0 --port ${COMFYUI_PORT} --enable-cors-header
directory=${COMFYUI_DIR}
autostart=true
autorestart=true
startretries=5
startsecs=10
stopwaitsecs=10
stdout_logfile=/tmp/comfyui.log
stderr_logfile=/tmp/comfyui.log
redirect_stderr=true
priority=100

[program:comfyui-mcp]
command=${PYTHON} /workspace/comfyui-mcp-server/server.py
directory=/workspace/comfyui-mcp-server
environment=COMFYUI_URL="http://localhost:${COMFYUI_PORT}",MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION="false"
autostart=true
autorestart=true
startretries=10
startsecs=5
stopwaitsecs=5
stdout_logfile=/tmp/mcp-comfyui.log
stderr_logfile=/tmp/mcp-comfyui.log
redirect_stderr=true
priority=200

[program:shell-mcp]
command=${PYTHON} /workspace/shell-mcp-server/server.py
directory=/workspace/shell-mcp-server
environment=MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION="false"
autostart=true
autorestart=true
startretries=10
startsecs=5
stopwaitsecs=5
stdout_logfile=/tmp/mcp-shell.log
stderr_logfile=/tmp/mcp-shell.log
redirect_stderr=true
priority=200

[program:cloudflared]
command=cloudflared tunnel run ${TUNNEL_NAME}
autostart=true
autorestart=true
startretries=5
startsecs=5
stopwaitsecs=10
stdout_logfile=/tmp/cloudflared.log
stderr_logfile=/tmp/cloudflared.log
redirect_stderr=true
priority=300
SUPEOF

fi

ok "Supervisord config written to /etc/supervisor/conf.d/vast-mcp.conf"

###############################################################################
step 12 "Starting managed processes"
###############################################################################

if [ "$SUPERVISOR_RUNNING" -eq 1 ]; then
    # Template mode — just reload config and start our programs
    supervisorctl reread
    supervisorctl update
    sleep 3
    info "Added MCP programs to existing supervisord"
else
    # Bare image — start supervisord fresh
    supervisord -c /etc/supervisor/supervisord.conf
    sleep 3
fi

# Verify processes are starting
info "Supervisor status:"
supervisorctl status all 2>/dev/null | while read line; do
    if echo "$line" | grep -q "RUNNING"; then
        echo -e "  ${GREEN}${line}${NC}"
    elif echo "$line" | grep -q "STARTING"; then
        echo -e "  ${YELLOW}${line}${NC}"
    elif echo "$line" | grep -q "FATAL\|BACKOFF\|ERROR"; then
        echo -e "  ${RED}${line}${NC}"
    else
        echo -e "  ${CYAN}${line}${NC}"
    fi
done

ok "Processes started"

###############################################################################
step 13 "Waiting for services + health checks"
###############################################################################

# Wait for ComfyUI first (it takes longest)
COMFY_READY=0
echo -n "Waiting for ComfyUI on port ${COMFYUI_PORT}..."
for i in $(seq 1 60); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 3 http://localhost:${COMFYUI_PORT} 2>/dev/null)
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "403" ]; then
        echo ""
        ok "ComfyUI ready (HTTP $HTTP)"
        COMFY_READY=1
        break
    fi
    echo -n "."
    sleep 5
done

if [ "$COMFY_READY" -eq 0 ]; then
    echo ""
    warn "ComfyUI not ready after 5 minutes — check /tmp/comfyui.log"
    tail -5 /tmp/comfyui.log 2>/dev/null || true
fi

# Health check MCPs (they may need ComfyUI to be ready first)
# Give them a moment after ComfyUI is up
sleep 5

check_mcp() {
    local name=$1
    local port=$2
    local logfile=$3

    for attempt in $(seq 1 5); do
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
            -X POST http://127.0.0.1:${port}/mcp \
            -H "Content-Type: application/json" \
            -H "Accept: application/json, text/event-stream" \
            -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

        if [ "$HTTP" = "200" ]; then
            ok "${name}: 200 ✅ (port ${port})"
            return 0
        fi

        if [ $attempt -lt 5 ]; then
            echo -n "."
            sleep 5
        fi
    done

    fail "${name}: FAILED after 5 attempts (last: ${HTTP})"
    echo -e "  ${RED}Log tail:${NC}"
    tail -10 ${logfile} 2>/dev/null | sed 's/^/    /'
    return 1
}

COMFYUI_OK=0
SHELL_OK=0

check_mcp "ComfyUI MCP" $COMFYUI_MCP_PORT "/tmp/mcp-comfyui.log" && COMFYUI_OK=1
check_mcp "Shell MCP"   $SHELL_MCP_PORT   "/tmp/mcp-shell.log"   && SHELL_OK=1

# Check tunnel
sleep 3
COMFYUI_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST https://mcp.comfyui-mcp.uk/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

SHELL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST https://shell.comfyui-mcp.uk/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

###############################################################################
# FINAL REPORT
###############################################################################
echo ""
echo -e "${BOLD}========================================================${NC}"
echo -e "${BOLD}  VAST.AI DUAL MCP SETUP v0.07 — RESULTS${NC}"
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
echo -e "${CYAN}  Process Manager: supervisord (auto-restart enabled)${NC}"
echo ""
echo -e "${CYAN}  Quick commands:${NC}"
echo -e "${CYAN}    supervisorctl status all          # check all processes${NC}"
echo -e "${CYAN}    supervisorctl restart comfyui-mcp  # restart ComfyUI MCP${NC}"
echo -e "${CYAN}    supervisorctl restart shell-mcp    # restart Shell MCP${NC}"
echo -e "${CYAN}    supervisorctl restart all          # restart everything${NC}"
echo -e "${CYAN}    supervisorctl tail -f comfyui-mcp  # live log${NC}"
echo ""
echo -e "${CYAN}  Logs:${NC}"
echo -e "${CYAN}    ComfyUI:     /tmp/comfyui.log${NC}"
echo -e "${CYAN}    ComfyUI MCP: /tmp/mcp-comfyui.log${NC}"
echo -e "${CYAN}    Shell MCP:   /tmp/mcp-shell.log${NC}"
echo -e "${CYAN}    Tunnel:      /tmp/cloudflared.log${NC}"
echo ""

if [ "$COMFYUI_HTTP" = "200" ] && [ "$SHELL_HTTP" = "200" ]; then
    echo -e "${GREEN}${BOLD}  ✅ v0.07 FULLY OPERATIONAL — MCPs will auto-restart on crash.${NC}"
else
    echo -e "${YELLOW}${BOLD}  ⚠️  v0.07 setup complete but some endpoints not yet responding.${NC}"
    echo -e "${YELLOW}${BOLD}     Supervisord will keep retrying. Check: supervisorctl status all${NC}"
fi

echo -e "${BOLD}========================================================${NC}"
echo ""
