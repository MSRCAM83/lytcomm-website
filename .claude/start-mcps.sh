#!/bin/bash
# ============================================================================
#  start-mcps.sh v0.01 — One-command MCP startup for any Vast.ai instance
# ============================================================================
#  Usage: curl -sL https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude/start-mcps.sh | bash
#
#  What it does:
#    1. Detects Python binary
#    2. Detects ComfyUI port
#    3. Clones/updates comfyui-mcp-server if missing
#    4. Downloads shell-mcp-server-v0.02.py if missing
#    5. Installs dependencies
#    6. Kills any existing MCP processes
#    7. Starts both MCPs with correct invocation
#    8. Health checks with 3 retries
#    9. Reports final status
#
#  Idempotent — safe to re-run anytime.
# ============================================================================

set -e

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
fail() { echo -e "  ${RED}❌ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "  ${CYAN}ℹ️  $1${NC}"; }

echo ""
echo -e "${MAGENTA}${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}${BOLD}  🚀 MCP Startup Script v0.01                        ${NC}"
echo -e "${MAGENTA}${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

GITHUB_RAW="https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude"
COMFYUI_MCP_DIR="/workspace/comfyui-mcp-server"
SHELL_MCP_DIR="/workspace/shell-mcp-server"
SHELL_MCP_FILE="${SHELL_MCP_DIR}/server.py"
COMFYUI_MCP_PORT=9000
SHELL_MCP_PORT=9001
MAX_RETRIES=3
RETRY_WAIT=5

# ── Step 1: Detect Python ──────────────────────────────────────────────────
echo -e "${BOLD}[1/8] Detecting Python...${NC}"
if [ -f "/venv/main/bin/python" ]; then
    PYTHON="/venv/main/bin/python"
    PIP="/venv/main/bin/pip"
elif command -v python3 &>/dev/null; then
    PYTHON=$(which python3)
    PIP="$PYTHON -m pip"
else
    fail "No Python found"; exit 1
fi
ok "Python: ${PYTHON}"

# ── Step 2: Detect ComfyUI port ───────────────────────────────────────────
echo -e "${BOLD}[2/8] Detecting ComfyUI...${NC}"
COMFYUI_PORT=""
for port in 18188 8188 8189; do
    if curl -s -o /dev/null -w "" --max-time 2 http://localhost:${port}/system_stats 2>/dev/null; then
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:${port}/system_stats)
        if [ "$HTTP" = "200" ]; then
            COMFYUI_PORT=$port
            break
        fi
    fi
done

if [ -z "$COMFYUI_PORT" ]; then
    fail "ComfyUI not running on any known port (18188, 8188, 8189)"
    echo -e "  ${RED}Start ComfyUI first, then re-run this script.${NC}"
    exit 1
fi
ok "ComfyUI on port ${COMFYUI_PORT}"

# ── Step 3: Ensure comfyui-mcp-server repo exists ─────────────────────────
echo -e "${BOLD}[3/8] Checking ComfyUI MCP server...${NC}"
if [ ! -d "${COMFYUI_MCP_DIR}" ]; then
    info "Cloning comfyui-mcp-server..."
    for i in 1 2 3; do
        cd /workspace && git clone https://github.com/joenorton/comfyui-mcp-server.git && break
        warn "Clone attempt $i failed, retrying..."
        rm -rf ${COMFYUI_MCP_DIR}
        sleep 3
    done
    if [ ! -d "${COMFYUI_MCP_DIR}" ]; then
        fail "Failed to clone ComfyUI MCP server after 3 attempts"; exit 1
    fi
    ok "Cloned"
else
    ok "Already present"
fi

# ── Step 4: Ensure shell-mcp-server exists ────────────────────────────────
echo -e "${BOLD}[4/8] Checking Shell MCP server...${NC}"
mkdir -p ${SHELL_MCP_DIR}
if [ ! -f "${SHELL_MCP_FILE}" ]; then
    info "Downloading shell-mcp-server-v0.02.py..."
    curl -sL "${GITHUB_RAW}/shell-mcp-server-v0.02.py" -o "${SHELL_MCP_FILE}"
    if [ ! -s "${SHELL_MCP_FILE}" ]; then
        fail "Download failed or empty file"; exit 1
    fi
    ok "Downloaded v0.02"
else
    # Verify it's v0.02 (check for the simplified constructor)
    if grep -q "version=" "${SHELL_MCP_FILE}" 2>/dev/null; then
        warn "Detected v0.01 (incompatible with mcp 1.26.0) — upgrading..."
        curl -sL "${GITHUB_RAW}/shell-mcp-server-v0.02.py" -o "${SHELL_MCP_FILE}"
        ok "Upgraded to v0.02"
    else
        ok "Already present (v0.02)"
    fi
fi

# ── Step 5: Install dependencies ──────────────────────────────────────────
echo -e "${BOLD}[5/8] Installing dependencies...${NC}"
cd ${COMFYUI_MCP_DIR}
if [ -f "requirements.txt" ]; then
    $PIP install -r requirements.txt --break-system-packages -q 2>/dev/null
fi
$PIP install mcp --break-system-packages -q 2>/dev/null
ok "Dependencies installed"

# ── Step 6: Kill existing MCP processes ───────────────────────────────────
echo -e "${BOLD}[6/8] Stopping existing MCPs...${NC}"
pkill -f "comfyui-mcp-server/server.py" 2>/dev/null || true
pkill -f "shell-mcp-server/server.py" 2>/dev/null || true
pkill -f "comfyui_mcp_server" 2>/dev/null || true
sleep 2
ok "Cleared"

# ── Step 7: Start both MCPs ──────────────────────────────────────────────
echo -e "${BOLD}[7/8] Starting MCPs...${NC}"

# ComfyUI MCP — runs server.py directly (NOT python -m)
COMFYUI_URL=http://localhost:${COMFYUI_PORT} \
MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION=false \
nohup $PYTHON ${COMFYUI_MCP_DIR}/server.py > /tmp/mcp-comfyui.log 2>&1 &
COMFYUI_MCP_PID=$!
info "ComfyUI MCP started (PID: ${COMFYUI_MCP_PID})"

# Shell MCP — runs server.py with env var for DNS rebinding
MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION=false \
nohup $PYTHON ${SHELL_MCP_FILE} > /tmp/mcp-shell.log 2>&1 &
SHELL_MCP_PID=$!
info "Shell MCP started (PID: ${SHELL_MCP_PID})"

sleep 3

# ── Step 8: Health checks with retries ───────────────────────────────────
echo -e "${BOLD}[8/8] Health checks...${NC}"

check_mcp() {
    local name=$1
    local port=$2
    local logfile=$3

    for attempt in $(seq 1 $MAX_RETRIES); do
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
            -X POST http://127.0.0.1:${port}/mcp \
            -H "Content-Type: application/json" \
            -H "Accept: application/json, text/event-stream" \
            -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

        if [ "$HTTP" = "200" ]; then
            ok "${name}: 200 ✅ (port ${port})"
            return 0
        fi

        if [ $attempt -lt $MAX_RETRIES ]; then
            warn "${name}: got ${HTTP}, retry ${attempt}/${MAX_RETRIES} in ${RETRY_WAIT}s..."
            sleep $RETRY_WAIT
        fi
    done

    fail "${name}: FAILED after ${MAX_RETRIES} attempts (last: ${HTTP})"
    echo -e "  ${RED}Log tail:${NC}"
    tail -10 ${logfile} 2>/dev/null | sed 's/^/    /'
    return 1
}

COMFYUI_OK=0
SHELL_OK=0

check_mcp "ComfyUI MCP" $COMFYUI_MCP_PORT "/tmp/mcp-comfyui.log" && COMFYUI_OK=1
check_mcp "Shell MCP"   $SHELL_MCP_PORT   "/tmp/mcp-shell.log"   && SHELL_OK=1

# ── Final Report ─────────────────────────────────────────────────────────
echo ""
echo -e "${MAGENTA}${BOLD}══════════════════════════════════════════════════════${NC}"
if [ $COMFYUI_OK -eq 1 ] && [ $SHELL_OK -eq 1 ]; then
    echo -e "${GREEN}${BOLD}  ✅ ALL MCPs RUNNING${NC}"
else
    echo -e "${RED}${BOLD}  ⚠️  PARTIAL FAILURE — check logs above${NC}"
fi
echo -e "${MAGENTA}${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}ComfyUI MCP:  port ${COMFYUI_MCP_PORT} → http://127.0.0.1:${COMFYUI_MCP_PORT}/mcp${NC}"
echo -e "  ${CYAN}Shell MCP:    port ${SHELL_MCP_PORT} → http://127.0.0.1:${SHELL_MCP_PORT}/mcp${NC}"
echo -e "  ${CYAN}Logs:         /tmp/mcp-comfyui.log | /tmp/mcp-shell.log${NC}"
echo ""
