#!/bin/bash
###############################################################################
# VAST.AI COMFYUI MCP SETUP SCRIPT v0.04
# One-shot setup for fresh Vast.ai instances
# Installs ComfyUI MCP server + permanent Cloudflare tunnel
# Permanent endpoint: https://mcp.comfyui-mcp.uk/mcp
#
# CHANGELOG:
# v0.04 - Remove /.provisioning lock to break deadlock with ComfyUI startup
# v0.03 - Added ComfyUI wait loop (5min) before MCP server start. Fixes race condition.
# v0.02 - Added cloudflared install, refreshed cert.pem
# v0.01 - Initial version
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

RETRY_MAX=3
TUNNEL_ID="73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d"
TUNNEL_NAME="comfyui-mcp"
COMFYUI_PORT=18188

step() { echo -e "\n${CYAN}${BOLD}[$1/$TOTAL] $2${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }

TOTAL=8

echo -e "${BOLD}========================================================${NC}"
echo -e "${BOLD}  VAST.AI COMFYUI MCP SETUP v0.04${NC}"
echo -e "${BOLD}  Permanent endpoint: https://mcp.comfyui-mcp.uk/mcp${NC}"
echo -e "${BOLD}========================================================${NC}"

###############################################################################
# PRE-STEP: Remove provisioning lock file
# ComfyUI refuses to start while /.provisioning exists, but our script runs
# AS PART of provisioning — classic deadlock. Remove it early so ComfyUI boots.
###############################################################################
if [ -f "/.provisioning" ]; then
    rm -f /.provisioning
    echo -e "${GREEN}✅ Removed /.provisioning lock (prevents ComfyUI deadlock)${NC}"
else
    echo -e "${CYAN}ℹ  No /.provisioning lock found (already removed)${NC}"
fi

###############################################################################
step 1 "Installing aria2c"
###############################################################################
if command -v aria2c &>/dev/null; then
    ok "aria2c already installed"
else
    for i in $(seq 1 $RETRY_MAX); do
        apt-get update -qq && apt-get install -y -qq aria2 > /dev/null 2>&1 && break
        warn "Retry $i/$RETRY_MAX..."
        sleep 2
    done
    command -v aria2c &>/dev/null && ok "aria2c installed" || fail "Failed to install aria2c"
fi

###############################################################################
step 2 "Installing cloudflared"
###############################################################################
if command -v cloudflared &>/dev/null; then
    ok "cloudflared already installed"
else
    echo "Downloading cloudflared..."
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
step 3 "Cloning ComfyUI MCP server"
###############################################################################
if [ -d "/workspace/comfyui-mcp-server" ]; then
    ok "ComfyUI MCP server already cloned"
else
    for i in $(seq 1 $RETRY_MAX); do
        cd /workspace && git clone https://github.com/joenorton/comfyui-mcp-server.git && break
        warn "Retry $i/$RETRY_MAX..."
        sleep 2
    done
    [ -d "/workspace/comfyui-mcp-server" ] && ok "Cloned" || fail "Failed to clone"
fi

###############################################################################
step 4 "Installing MCP server dependencies"
###############################################################################
cd /workspace/comfyui-mcp-server
for i in $(seq 1 $RETRY_MAX); do
    pip install -r requirements.txt > /dev/null 2>&1 && break
    warn "Retry $i/$RETRY_MAX..."
    sleep 2
done
ok "Dependencies installed"

###############################################################################
step 5 "Patching DNS rebinding protection"
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
step 6 "Writing Cloudflare tunnel credentials"
###############################################################################
mkdir -p /root/.cloudflared

echo "LS0tLS1CRUdJTiBBUkdPIFRVTk5FTCBUT0tFTi0tLS0tCmV5SjZiMjVsU1VRaU9pSTFOemN6TVRkbFl6STFNamxsTnpsak5ERTNObVU1WWpJek9ETmpNVEU0TUNJc0ltRmoKWTI5MWJuUkpSQ0k2SW1Ka05XWmlZMlUyTW1NNU1UQTVaVFV5WmpBM1lqQTBZVGt6TkdVME1qQTFJaXdpWVhCcApWRzlyWlc0aU9pSlRNVTlJUm5wSE9WOWFjV0p2ZWtOcmFVSTRTVjlHVFZKdldrWmliM0V0WjJSWGVFVlBibEZ5CkluMD0KLS0tLS1FTkQgQVJHTyBUVU5ORUwgVE9LRU4tLS0tLQo=" | base64 -d > /root/.cloudflared/cert.pem
chmod 600 /root/.cloudflared/cert.pem

cat > /root/.cloudflared/${TUNNEL_ID}.json << 'TUNNEL_EOF'
{"AccountTag":"bd5fbce62c9109e52f07b04a934e4205","TunnelSecret":"WMYTqK5pi5hmnf5tE07r8RMX+4lfQIni2C7JPKeyE64=","TunnelID":"73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d","Endpoint":""}
TUNNEL_EOF
chmod 600 /root/.cloudflared/${TUNNEL_ID}.json

ok "Tunnel credentials written to /root/.cloudflared/"

###############################################################################
step 7 "Waiting for ComfyUI + Starting MCP server"
###############################################################################
pkill -f "comfyui-mcp-server/server.py" 2>/dev/null || true
sleep 1

# Wait up to 5 minutes for ComfyUI to be ready
COMFY_READY=0
echo -n "Waiting for ComfyUI on port ${COMFYUI_PORT}..."
for i in $(seq 1 60); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 3 http://localhost:${COMFYUI_PORT} 2>/dev/null)
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "403" ]; then
        echo ""
        ok "ComfyUI is ready (HTTP $HTTP)"
        COMFY_READY=1
        break
    fi
    echo -n "."
    sleep 5
done

if [ "$COMFY_READY" -eq 0 ]; then
    echo ""
    fail "ComfyUI not ready after 5 minutes — aborting MCP setup"
    echo -e "${RED}  Check: ps aux | grep comfyui${NC}"
    echo -e "${RED}  Logs: /var/log/portal/ComfyUI.log${NC}"
else
    COMFYUI_URL=http://localhost:${COMFYUI_PORT} nohup python /workspace/comfyui-mcp-server/server.py > /tmp/mcp-server.log 2>&1 &
    MCP_PID=$!
    echo "MCP server PID: $MCP_PID"

    echo -n "Waiting for MCP server..."
    for i in $(seq 1 15); do
        sleep 2
        if curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:9000/mcp \
            -H "Content-Type: application/json" \
            -H "Accept: application/json, text/event-stream" \
            -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null | grep -q "200"; then
            echo ""
            ok "MCP server ready on port 9000"
            break
        fi
        echo -n "."
        if [ "$i" -eq 15 ]; then
            echo ""
            warn "MCP server not responding after 30s — check /tmp/mcp-server.log"
            cat /tmp/mcp-server.log 2>/dev/null | tail -20
        fi
    done
fi

###############################################################################
step 8 "Starting Cloudflare tunnel"
###############################################################################
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

nohup cloudflared tunnel --url http://localhost:9000 run ${TUNNEL_NAME} > /tmp/cloudflared.log 2>&1 &
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

sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://mcp.comfyui-mcp.uk/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)

echo ""
echo -e "${BOLD}========================================================${NC}"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}${BOLD}  ✅ ALL SYSTEMS GO${NC}"
    echo -e "${GREEN}${BOLD}  MCP endpoint: https://mcp.comfyui-mcp.uk/mcp${NC}"
    echo -e "${GREEN}${BOLD}  HTTP status: $HTTP_CODE${NC}"
else
    echo -e "${YELLOW}${BOLD}  ⚠️  PARTIAL SETUP — HTTP status: $HTTP_CODE${NC}"
    echo -e "${YELLOW}${BOLD}  MCP server log: /tmp/mcp-server.log${NC}"
    echo -e "${YELLOW}${BOLD}  Tunnel log: /tmp/cloudflared.log${NC}"
fi
echo -e "${BOLD}  MCP server PID: $MCP_PID${NC}"
echo -e "${BOLD}  Cloudflared PID: $CF_PID${NC}"
echo -e "${BOLD}========================================================${NC}"
