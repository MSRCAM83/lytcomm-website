#!/bin/bash
###############################################################################
# VAST.AI COMFYUI MCP SETUP SCRIPT v0.01
# One-shot setup for fresh Vast.ai instances
# Installs ComfyUI MCP server + permanent Cloudflare tunnel
# Permanent endpoint: https://mcp.comfyui-mcp.uk/mcp
###############################################################################

set -e

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
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

TOTAL=7

echo -e "${BOLD}========================================================${NC}"
echo -e "${BOLD}  VAST.AI COMFYUI MCP SETUP v0.01${NC}"
echo -e "${BOLD}  Permanent endpoint: https://mcp.comfyui-mcp.uk/mcp${NC}"
echo -e "${BOLD}========================================================${NC}"

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
step 2 "Cloning ComfyUI MCP server"
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
step 3 "Installing MCP server dependencies"
###############################################################################
cd /workspace/comfyui-mcp-server
for i in $(seq 1 $RETRY_MAX); do
    pip install -r requirements.txt > /dev/null 2>&1 && break
    warn "Retry $i/$RETRY_MAX..."
    sleep 2
done
ok "Dependencies installed"

###############################################################################
step 4 "Patching DNS rebinding protection"
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
step 5 "Writing Cloudflare tunnel credentials"
###############################################################################
mkdir -p /root/.cloudflared

# Write cert.pem
echo "LS0tLS1CRUdJTiBBUkdPIFRVTk5FTCBUT0tFTi0tLS0tCmV5SjZiMjVsU1VRaU9pSTFOemN6TVRkbFl6STFNamxsTnpsak5ERTNObVU1WWpJek9ETmpNVEU0TUNJc0ltRmoKWTI5MWJuUlNSQ0k2SW1Ka05XWmlZMlUyTW1NNU1UQTVaVFV5WmpBM1lqQTBZVGt6TkdVME1qQTFJaXdpWVhCcApWRzlyWlc0aU9pSTJiMFE1YlV3Mk16RmpOV1ppZFZaaU4zRkdkbFIwTUU4dFp5MDVkelJDZGxKUVdEUjZZbkp3CkluMD0KLS0tLS1FTkQgQVJHTyBUVU5ORUwgVE9LRU4tLS0tLQo=" | base64 -d > /root/.cloudflared/cert.pem
chmod 600 /root/.cloudflared/cert.pem

# Write tunnel credentials JSON
cat > /root/.cloudflared/${TUNNEL_ID}.json << 'TUNNEL_EOF'
{"AccountTag":"bd5fbce62c9109e52f07b04a934e4205","TunnelSecret":"WMYTqK5pi5hmnf5tE07r8RMX+4lfQIni2C7JPKeyE64=","TunnelID":"73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d","Endpoint":""}
TUNNEL_EOF
chmod 600 /root/.cloudflared/${TUNNEL_ID}.json

ok "Tunnel credentials written to /root/.cloudflared/"

###############################################################################
step 6 "Starting ComfyUI MCP server"
###############################################################################
# Kill any existing MCP server
pkill -f "comfyui-mcp-server/server.py" 2>/dev/null || true
sleep 1

# Verify ComfyUI is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${COMFYUI_PORT} | grep -q "200"; then
    ok "ComfyUI running on port ${COMFYUI_PORT}"
else
    warn "ComfyUI not responding on port ${COMFYUI_PORT} — MCP server will retry"
fi

# Start MCP server
COMFYUI_URL=http://localhost:${COMFYUI_PORT} nohup python /workspace/comfyui-mcp-server/server.py > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!
echo "MCP server PID: $MCP_PID"

# Wait for it to be ready
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
        cat /tmp/mcp-server.log | tail -20
    fi
done

###############################################################################
step 7 "Starting Cloudflare tunnel"
###############################################################################
# Kill any existing tunnel
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

nohup cloudflared tunnel --url http://localhost:9000 run ${TUNNEL_NAME} > /tmp/cloudflared.log 2>&1 &
CF_PID=$!
echo "Cloudflared PID: $CF_PID"

# Wait for tunnel to register
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

# Final verification
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
