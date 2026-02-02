#!/bin/bash
###############################################################################
# 🚀 COMFYUI + CLAUDE MCP STACK — FRIEND EDITION v0.01
#
# WHAT THIS DOES:
#   Gives you AI image generation directly from Claude.ai.
#   Rents a cloud GPU, installs ComfyUI + MCP servers, creates secure
#   tunnels, and tells you exactly what to paste into Claude.ai settings.
#
# REQUIREMENTS:
#   - A Vast.ai account with credit (https://vast.ai — GPU rental, ~$0.50/hr)
#   - Your Vast.ai API key (Account → API Keys → copy it)
#   - bash, curl, python3, ssh (standard on Mac/Linux/WSL)
#
# OPTIONAL:
#   - CivitAI API token (for downloading better AI models)
#   - HuggingFace token (for gated model access)
#
# USAGE:
#   chmod +x comfyui-claude-setup.sh
#   ./comfyui-claude-setup.sh
#
# WHAT HAPPENS:
#   1. You enter your Vast.ai API key
#   2. Script finds the cheapest GPU with enough VRAM
#   3. Launches a cloud instance and installs everything
#   4. Gives you 2 URLs to paste into Claude.ai settings
#   5. You can generate images by talking to Claude!
#
# TO SHUT DOWN (stop billing):
#   Visit https://console.vast.ai/instances/ and destroy the instance
#
# Created by Matt Roy's AI Workshop
###############################################################################

set -euo pipefail

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# === HELPERS ===
log()    { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()     { echo -e "${GREEN}[✅]${NC} $1"; }
warn()   { echo -e "${YELLOW}[⚠️]${NC} $1"; }
err()    { echo -e "${RED}[❌]${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}"; echo -e "${BOLD}${CYAN}  $1${NC}"; echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}\n"; }

# === CONFIG ===
DOCKER_IMAGE="vastai/comfy:v0.10.0-cuda-12.9-py312"
TEMPLATE_ID=336394
MAX_PRICE=1.50
MIN_VRAM=24000
MIN_RELIABILITY=0.95
MIN_BANDWIDTH=200
COMFYUI_PORT=18188
COMFYUI_MCP_PORT=9000
SHELL_MCP_PORT=9001
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

###############################################################################
header "COMFYUI + CLAUDE MCP STACK — FRIEND EDITION"
###############################################################################

echo -e "${CYAN}This script will:${NC}"
echo -e "  1. Rent a cloud GPU on Vast.ai (~\$0.50-1.50/hr)"
echo -e "  2. Install ComfyUI (AI image generation)"
echo -e "  3. Install MCP servers (connects ComfyUI to Claude.ai)"
echo -e "  4. Create secure tunnels so Claude can reach it"
echo -e "  5. Give you URLs to paste into Claude.ai settings"
echo ""
echo -e "${YELLOW}You'll need your Vast.ai API key ready.${NC}"
echo -e "${YELLOW}Get it at: https://cloud.vast.ai/cli/ → copy the API key${NC}"
echo ""

###############################################################################
# STEP 0: COLLECT TOKENS
###############################################################################
header "STEP 0: Enter Your Credentials"

# Vast API key (required)
while true; do
    read -p "$(echo -e ${BOLD})Vast.ai API Key: $(echo -e ${NC})" VAST_TOKEN
    if [ ${#VAST_TOKEN} -lt 20 ]; then
        err "That doesn't look right. Vast API keys are ~64 characters."
        continue
    fi
    # Validate it
    log "Validating API key..."
    VALIDATE=$(curl -sL "https://console.vast.ai/api/v0/instances?owner=me&api_key=$VAST_TOKEN" 2>/dev/null)
    if echo "$VALIDATE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if 'instances' in d else 1)" 2>/dev/null; then
        ok "Vast.ai API key valid!"
        break
    else
        err "Invalid API key. Check https://cloud.vast.ai/cli/ and try again."
    fi
done

echo ""

# CivitAI token (optional — for model downloads)
read -p "$(echo -e ${BOLD})CivitAI API Token (optional, press Enter to skip): $(echo -e ${NC})" CIVITAI_TOKEN
if [ -n "$CIVITAI_TOKEN" ]; then
    ok "CivitAI token saved"
else
    warn "No CivitAI token — will use a free HuggingFace model instead"
    CIVITAI_TOKEN=""
fi

echo ""

# HuggingFace token (optional)
read -p "$(echo -e ${BOLD})HuggingFace Token (optional, press Enter to skip): $(echo -e ${NC})" HF_TOKEN
if [ -n "$HF_TOKEN" ]; then
    ok "HuggingFace token saved"
else
    HF_TOKEN=""
fi

###############################################################################
# STEP 1: PREFLIGHT CHECKS
###############################################################################
header "STEP 1: Preflight Checks"

for cmd in curl python3 ssh ssh-keygen scp; do
    if command -v $cmd &>/dev/null; then
        ok "$cmd available"
    else
        err "$cmd not found — install openssh and python3 first"
        exit 1
    fi
done

# Check for existing instances
log "Checking for existing Vast.ai instances..."
EXISTING=$(curl -sL "https://console.vast.ai/api/v0/instances?owner=me&api_key=$VAST_TOKEN" 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
instances = d.get('instances', [])
running = [i for i in instances if i.get('actual_status') == 'running']
if running:
    for i in running:
        print(f'  ID:{i[\"id\"]} | {i.get(\"gpu_name\",\"?\")} | \${i.get(\"dph_total\",0):.3f}/hr')
    print(f'FOUND:{len(running)}')
else:
    print('FOUND:0')
" 2>/dev/null)

EXISTING_COUNT=$(echo "$EXISTING" | grep -oP 'FOUND:\K\d+' 2>/dev/null || echo "0")
if [ "$EXISTING_COUNT" != "0" ]; then
    warn "Found $EXISTING_COUNT running instance(s):"
    echo "$EXISTING" | grep -v "FOUND:"
    read -p "Kill them and start fresh? (y/N): " KILL_EM
    if [ "$KILL_EM" = "y" ] || [ "$KILL_EM" = "Y" ]; then
        echo "$EXISTING" | grep -oP 'ID:\K\d+' | while read ID; do
            curl -sL -X DELETE "https://console.vast.ai/api/v0/instances/$ID/?api_key=$VAST_TOKEN" &>/dev/null
            log "Killed instance $ID"
        done
        sleep 3
    fi
fi

###############################################################################
# STEP 2: GENERATE + UPLOAD SSH KEY
###############################################################################
header "STEP 2: Setting Up SSH Access"

SSH_KEY="$TMPDIR/vast_temp_key"
ssh-keygen -t ed25519 -f "$SSH_KEY" -N "" -q
ok "Generated temporary SSH keypair"

SSH_PUB=$(cat "${SSH_KEY}.pub")
log "Uploading public key to your Vast.ai account..."

UPLOAD_RESULT=$(curl -sL -X POST "https://console.vast.ai/api/v0/ssh/?api_key=$VAST_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"ssh_key\": \"$SSH_PUB\"}" 2>/dev/null)

if echo "$UPLOAD_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('id') or d.get('success') else 1)" 2>/dev/null; then
    ok "SSH key uploaded to Vast.ai"
    SSH_KEY_ID=$(echo "$UPLOAD_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
else
    warn "Could not auto-upload SSH key."
    echo -e "${YELLOW}Please manually add this key to your Vast.ai account:${NC}"
    echo -e "${YELLOW}  Go to: https://cloud.vast.ai/cli/ → SSH Keys → Add${NC}"
    echo ""
    echo "$SSH_PUB"
    echo ""
    read -p "Press Enter after you've added it..."
fi

###############################################################################
# STEP 3: SEARCH FOR GPU
###############################################################################
header "STEP 3: Finding Best GPU"

log "Searching for GPUs: ≤\$$MAX_PRICE/hr, ≥24GB VRAM, ≥0.95 reliability..."

SEARCH_RESULT=$(python3 -c "
import urllib.parse, json, subprocess

q = {
    'rentable': {'eq': True},
    'gpu_ram': {'gte': $MIN_VRAM},
    'dph_total': {'lte': $MAX_PRICE},
    'reliability': {'gte': $MIN_RELIABILITY},
    'inet_down': {'gte': $MIN_BANDWIDTH},
    'order': [['dph_total', 'asc']],
    'type': 'on-demand'
}
encoded = urllib.parse.quote(json.dumps(q))
url = f'https://console.vast.ai/api/v0/bundles/?q={encoded}&api_key=$VAST_TOKEN'

result = subprocess.run(['curl', '-sL', url], capture_output=True, text=True)
d = json.loads(result.stdout)
offers = d.get('offers', [])

if not offers:
    print('NO_OFFERS')
else:
    big = [o for o in offers if o.get('gpu_ram', 0) >= 40000]
    pick = big[0] if big else offers[0]
    print(f'OFFER_ID={pick[\"id\"]}')
    print(f'GPU={pick[\"gpu_name\"]}')
    print(f'VRAM={pick.get(\"gpu_ram\",0)/1024:.0f}GB')
    print(f'PRICE=\${pick[\"dph_total\"]:.3f}/hr')
    print(f'LOCATION={pick.get(\"geolocation\",\"?\")}')
    print(f'RELIABILITY={pick.get(\"reliability\",0):.3f}')
    print(f'TOTAL_OFFERS={len(offers)}')
" 2>/dev/null)

if echo "$SEARCH_RESULT" | grep -q "NO_OFFERS"; then
    err "No GPUs available matching criteria. Try again in a few minutes."
    exit 1
fi

OFFER_ID=$(echo "$SEARCH_RESULT" | grep -oP 'OFFER_ID=\K\d+')
GPU_NAME=$(echo "$SEARCH_RESULT" | grep -oP 'GPU=\K.*')
GPU_VRAM=$(echo "$SEARCH_RESULT" | grep -oP 'VRAM=\K.*')
GPU_PRICE=$(echo "$SEARCH_RESULT" | grep -oP 'PRICE=\K.*')
GPU_LOCATION=$(echo "$SEARCH_RESULT" | grep -oP 'LOCATION=\K.*')
TOTAL_OFFERS=$(echo "$SEARCH_RESULT" | grep -oP 'TOTAL_OFFERS=\K\d+')

ok "Found $TOTAL_OFFERS GPUs. Selected:"
echo -e "   ${BOLD}$GPU_NAME ($GPU_VRAM)${NC} — $GPU_PRICE/hr — $GPU_LOCATION"
echo ""

###############################################################################
# STEP 4: LAUNCH INSTANCE
###############################################################################
header "STEP 4: Launching Cloud GPU"

log "Creating instance..."

LAUNCH_RESULT=$(curl -sL -X PUT -H "Authorization: Bearer $VAST_TOKEN" \
  "https://console.vast.ai/api/v0/asks/${OFFER_ID}/?api_key=$VAST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"me\",
    \"image\": \"$DOCKER_IMAGE\",
    \"disk\": 80,
    \"runtype\": \"jupyter_direct\",
    \"template_id\": $TEMPLATE_ID,
    \"extra_env\": {
      \"COMFYUI_ARGS\": \"--disable-auto-launch --port $COMFYUI_PORT --enable-cors-header\",
      \"PROVISIONING_SCRIPT\": \"\",
      \"PORTAL_CONFIG\": \"localhost:1111:11111:/:Instance Portal|localhost:8188:${COMFYUI_PORT}:/:ComfyUI|localhost:8080:18080:/:Jupyter\",
      \"OPEN_BUTTON_PORT\": \"1111\",
      \"JUPYTER_DIR\": \"/\",
      \"DATA_DIRECTORY\": \"/workspace/\",
      \"OPEN_BUTTON_TOKEN\": \"1\",
      \"-p 1111:1111\": \"1\",
      \"-p 8080:8080\": \"1\",
      \"-p 9000:9000\": \"1\",
      \"-p 9001:9001\": \"1\"
    }
  }" 2>/dev/null)

INSTANCE_ID=$(echo "$LAUNCH_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('new_contract','FAILED'))" 2>/dev/null)

if [ "$INSTANCE_ID" = "FAILED" ] || [ -z "$INSTANCE_ID" ]; then
    err "Launch failed: $LAUNCH_RESULT"
    exit 1
fi

ok "Instance $INSTANCE_ID created! (billing starts now: $GPU_PRICE/hr)"

###############################################################################
# STEP 5: WAIT FOR INSTANCE BOOT
###############################################################################
header "STEP 5: Waiting for Instance to Boot"

WAITED=0
SSH_HOST=""
SSH_PORT=""

while [ $WAITED -lt 120 ]; do
    STATUS_RAW=$(curl -sL "https://console.vast.ai/api/v0/instances/${INSTANCE_ID}/?api_key=$VAST_TOKEN" 2>/dev/null)

    eval $(echo "$STATUS_RAW" | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
inst = d.get('instances', d)
print(f'INST_STATUS={inst.get(\"actual_status\",\"?\")!r}')
print(f'SSH_HOST={inst.get(\"ssh_host\",\"\")!r}')
print(f'SSH_PORT={inst.get(\"ssh_port\",\"\")!r}')
" 2>/dev/null)

    if [ "$INST_STATUS" = "running" ] && [ -n "$SSH_HOST" ] && [ -n "$SSH_PORT" ]; then
        ok "Instance running! SSH: $SSH_HOST:$SSH_PORT"
        break
    fi

    log "Status: $INST_STATUS (${WAITED}s)"
    sleep 10
    WAITED=$((WAITED + 10))
done

if [ "$INST_STATUS" != "running" ]; then
    err "Instance didn't start in 120s. Check https://console.vast.ai/instances/"
    exit 1
fi

###############################################################################
# STEP 6: WAIT FOR SSH TO BE READY
###############################################################################
log "Waiting for SSH to accept connections..."

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o LogLevel=ERROR -i $SSH_KEY"

WAITED=0
while [ $WAITED -lt 90 ]; do
    if ssh $SSH_OPTS -p "$SSH_PORT" root@"$SSH_HOST" "echo SSH_READY" 2>/dev/null | grep -q "SSH_READY"; then
        ok "SSH connection established!"
        break
    fi
    sleep 10
    WAITED=$((WAITED + 10))
    log "SSH not ready yet (${WAITED}s)..."
done

if [ $WAITED -ge 90 ]; then
    err "Could not SSH in after 90s. The instance may still be loading."
    err "Try manually: ssh -i $SSH_KEY -p $SSH_PORT root@$SSH_HOST"
    exit 1
fi

###############################################################################
# STEP 7: WRITE EMBEDDED FILES TO TEMP DIR
###############################################################################
header "STEP 7: Preparing Installation Files"

# ----- SHELL MCP SERVER (full Python file) -----
cat > "$TMPDIR/shell-mcp-server.py" << 'SHELLMCP_EOF'
#!/usr/bin/env python3
"""
SHELL MCP SERVER v0.03 — Friend Edition
Full OS-level control via Model Context Protocol (streamable-http)
Runs on port 9001 alongside ComfyUI MCP (port 9000)
"""

import asyncio
import base64
import json
import logging
import os
import platform
import shutil
import signal
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("shell-mcp")

mcp = FastMCP(
    "Shell MCP Server",
    host="0.0.0.0",
    port=9001,
    stateless_http=True,
)


@mcp.tool(
    name="run_command",
    description="Execute a bash command. Returns stdout, stderr, and exit code.",
)
def run_command(
    command: str, timeout: int = 120, cwd: Optional[str] = None
) -> dict:
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=cwd,
        )
        return {
            "stdout": result.stdout[-50000:] if len(result.stdout) > 50000 else result.stdout,
            "stderr": result.stderr[-10000:] if len(result.stderr) > 10000 else result.stderr,
            "exit_code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"error": f"Command timed out after {timeout}s", "exit_code": -1}
    except Exception as e:
        return {"error": str(e), "exit_code": -1}


@mcp.tool(
    name="read_file",
    description="Read file contents. Supports text and binary (base64) modes.",
)
def read_file(
    path: str,
    encoding: str = "utf-8",
    max_bytes: int = 1_000_000,
    binary_mode: bool = False,
) -> dict:
    try:
        p = Path(path).expanduser().resolve()
        if not p.exists():
            return {"error": f"File not found: {path}"}
        if not p.is_file():
            return {"error": f"Not a file: {path}"}
        size = p.stat().st_size
        if size > max_bytes:
            return {"error": f"File too large: {_human_size(size)} (max {_human_size(max_bytes)})"}
        if binary_mode:
            data = p.read_bytes()
            return {
                "content_base64": base64.b64encode(data).decode("ascii"),
                "size": size,
                "path": str(p),
            }
        else:
            return {
                "content": p.read_text(encoding=encoding),
                "size": size,
                "path": str(p),
            }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="write_file",
    description="Write content to a file. Creates parent directories if needed.",
)
def write_file(path: str, content: str, encoding: str = "utf-8") -> dict:
    try:
        p = Path(path).expanduser().resolve()
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding=encoding)
        return {"success": True, "path": str(p), "size": p.stat().st_size}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="append_file",
    description="Append content to an existing file (or create it).",
)
def append_file(path: str, content: str, encoding: str = "utf-8") -> dict:
    try:
        p = Path(path).expanduser().resolve()
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "a", encoding=encoding) as f:
            f.write(content)
        return {"success": True, "path": str(p), "size": p.stat().st_size}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="list_directory",
    description="List directory contents with sizes and types. Supports recursive listing.",
)
def list_directory(
    path: str = ".",
    recursive: bool = False,
    max_depth: int = 3,
    show_hidden: bool = False,
) -> dict:
    try:
        p = Path(path).expanduser().resolve()
        if not p.exists():
            return {"error": f"Path not found: {path}"}
        if not p.is_dir():
            return {"error": f"Not a directory: {path}"}

        entries = []

        def _scan(dir_path, depth=0):
            if depth > max_depth:
                return
            try:
                for item in sorted(dir_path.iterdir()):
                    if not show_hidden and item.name.startswith("."):
                        continue
                    entry = {
                        "name": item.name,
                        "path": str(item),
                        "type": "dir" if item.is_dir() else "file",
                    }
                    if item.is_file():
                        try:
                            entry["size"] = _human_size(item.stat().st_size)
                        except OSError:
                            entry["size"] = "?"
                    entries.append(entry)
                    if recursive and item.is_dir():
                        _scan(item, depth + 1)
            except PermissionError:
                entries.append({"name": str(dir_path), "error": "permission denied"})

        _scan(p)
        if len(entries) > 500:
            entries = entries[:500]
            return {"entries": entries, "truncated": True, "total_shown": 500}
        return {"entries": entries, "total": len(entries), "path": str(p)}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="file_info",
    description="Get detailed file/directory metadata: size, permissions, timestamps.",
)
def file_info(path: str) -> dict:
    try:
        p = Path(path).expanduser().resolve()
        if not p.exists():
            return {"error": f"Path not found: {path}"}
        st = p.stat()
        return {
            "path": str(p),
            "type": "dir" if p.is_dir() else ("symlink" if p.is_symlink() else "file"),
            "size": _human_size(st.st_size),
            "size_bytes": st.st_size,
            "permissions": oct(st.st_mode)[-3:],
            "owner_uid": st.st_uid,
            "group_gid": st.st_gid,
            "modified": datetime.fromtimestamp(st.st_mtime).isoformat(),
            "created": datetime.fromtimestamp(st.st_ctime).isoformat(),
            "accessed": datetime.fromtimestamp(st.st_atime).isoformat(),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="delete_path",
    description="Delete a file or directory. Use recursive=True for non-empty directories.",
)
def delete_path(path: str, recursive: bool = False) -> dict:
    try:
        p = Path(path).expanduser().resolve()
        if not p.exists():
            return {"error": f"Path not found: {path}"}
        if p.is_dir():
            if recursive:
                shutil.rmtree(p)
            else:
                p.rmdir()
        else:
            p.unlink()
        return {"success": True, "deleted": str(p)}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="move_path",
    description="Move or rename a file/directory.",
)
def move_path(source: str, destination: str) -> dict:
    try:
        src = Path(source).expanduser().resolve()
        dst = Path(destination).expanduser().resolve()
        if not src.exists():
            return {"error": f"Source not found: {source}"}
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        return {"success": True, "from": str(src), "to": str(dst)}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="upload_base64",
    description="Write binary content from base64 string to a file.",
)
def upload_base64(path: str, b64_content: str) -> dict:
    try:
        p = Path(path).expanduser().resolve()
        p.parent.mkdir(parents=True, exist_ok=True)
        data = base64.b64decode(b64_content)
        p.write_bytes(data)
        return {"success": True, "path": str(p), "size": len(data)}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="download_base64",
    description="Read a file and return its content as base64.",
)
def download_base64(path: str) -> dict:
    try:
        p = Path(path).expanduser().resolve()
        if not p.exists():
            return {"error": f"File not found: {path}"}
        if not p.is_file():
            return {"error": f"Not a file: {path}"}
        size = p.stat().st_size
        if size > 50_000_000:
            return {"error": f"File too large: {_human_size(size)} (max 50MB)"}
        data = p.read_bytes()
        return {
            "content_base64": base64.b64encode(data).decode("ascii"),
            "size": size,
            "path": str(p),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="process_list",
    description="List running processes. Optionally filter by name.",
)
def process_list(filter_str: Optional[str] = None) -> dict:
    try:
        result = subprocess.run(
            ["ps", "aux"], capture_output=True, text=True, timeout=10
        )
        lines = result.stdout.strip().split("\n")
        header = lines[0] if lines else ""
        processes = []
        for line in lines[1:]:
            if filter_str and filter_str.lower() not in line.lower():
                continue
            parts = line.split(None, 10)
            if len(parts) >= 11:
                processes.append({
                    "user": parts[0], "pid": parts[1], "cpu": parts[2],
                    "mem": parts[3], "vsz": parts[4], "rss": parts[5],
                    "command": parts[10],
                })
        return {"header": header, "processes": processes, "count": len(processes)}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="kill_process",
    description="Kill a process by PID or name.",
)
def kill_process(
    pid: Optional[int] = None,
    name: Optional[str] = None,
    signal_num: int = 15,
) -> dict:
    try:
        if pid:
            os.kill(pid, signal_num)
            return {"success": True, "killed_pid": pid, "signal": signal_num}
        elif name:
            result = subprocess.run(
                ["pkill", f"-{signal_num}", "-f", name],
                capture_output=True, text=True,
            )
            return {
                "success": result.returncode == 0,
                "pattern": name,
                "signal": signal_num,
            }
        else:
            return {"error": "Provide either pid or name"}
    except ProcessLookupError:
        return {"error": f"Process {pid} not found"}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="disk_usage",
    description="Show disk space and optionally directory sizes.",
)
def disk_usage(path: str = "/", show_du: bool = False, du_depth: int = 1) -> dict:
    try:
        total, used, free = shutil.disk_usage(path)
        result = {
            "path": path,
            "total": _human_size(total),
            "used": _human_size(used),
            "free": _human_size(free),
            "percent_used": f"{used/total*100:.1f}%",
        }
        if show_du:
            du = subprocess.run(
                ["du", "-h", f"--max-depth={du_depth}", path],
                capture_output=True, text=True, timeout=30,
            )
            result["du_output"] = du.stdout[-5000:]
        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="system_info",
    description="Get comprehensive system info: CPU, RAM, GPU, disk, OS.",
)
def system_info() -> dict:
    try:
        info = {
            "hostname": platform.node(),
            "os": f"{platform.system()} {platform.release()}",
            "arch": platform.machine(),
            "python": sys.version.split()[0],
        }
        try:
            with open("/proc/cpuinfo") as f:
                cpuinfo = f.read()
            models = [l.split(":")[1].strip() for l in cpuinfo.split("\n") if "model name" in l]
            info["cpu"] = {"model": models[0] if models else "?", "cores": len(models)}
        except:
            info["cpu"] = "unknown"
        try:
            with open("/proc/meminfo") as f:
                meminfo = f.read()
            for line in meminfo.split("\n"):
                if "MemTotal" in line:
                    kb = int(line.split()[1])
                    info["ram_total"] = _human_size(kb * 1024)
                elif "MemAvailable" in line:
                    kb = int(line.split()[1])
                    info["ram_available"] = _human_size(kb * 1024)
        except:
            pass
        try:
            gpu = subprocess.run(
                ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,temperature.gpu,utilization.gpu",
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=10,
            )
            if gpu.returncode == 0:
                gpus = []
                for line in gpu.stdout.strip().split("\n"):
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 5:
                        gpus.append({
                            "name": parts[0], "vram_total_mb": parts[1],
                            "vram_free_mb": parts[2], "temp_c": parts[3],
                            "util_pct": parts[4],
                        })
                info["gpus"] = gpus
        except:
            info["gpus"] = "nvidia-smi not available"
        total, used, free = shutil.disk_usage("/")
        info["disk"] = {"total": _human_size(total), "used": _human_size(used), "free": _human_size(free)}
        return info
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="gpu_info",
    description="Detailed GPU info from nvidia-smi.",
)
def gpu_info() -> dict:
    try:
        result = subprocess.run(
            ["nvidia-smi"], capture_output=True, text=True, timeout=10
        )
        return {"output": result.stdout, "exit_code": result.returncode}
    except FileNotFoundError:
        return {"error": "nvidia-smi not found"}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="install_package",
    description="Install a package via pip or apt.",
)
def install_package(
    package: str,
    manager: str = "pip",
    extra_args: str = "",
) -> dict:
    try:
        if manager == "pip":
            cmd = f"pip install {package} --break-system-packages {extra_args}"
        elif manager == "apt":
            cmd = f"apt-get install -y {package} {extra_args}"
        else:
            return {"error": f"Unknown manager: {manager}"}
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=300,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout[-5000:],
            "stderr": result.stderr[-2000:],
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool(
    name="environment",
    description="Get or set environment variables. Set value=None to just read.",
)
def environment(
    name: Optional[str] = None,
    value: Optional[str] = None,
    list_all: bool = False,
) -> dict:
    try:
        if list_all:
            return {"variables": {k: v for k, v in sorted(os.environ.items())}}
        if name and value is not None:
            os.environ[name] = value
            return {"set": name, "value": value}
        if name:
            return {"name": name, "value": os.environ.get(name, None)}
        return {"error": "Provide name, or use list_all=True"}
    except Exception as e:
        return {"error": str(e)}


def _human_size(nbytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if abs(nbytes) < 1024:
            return f"{nbytes:.1f}{unit}"
        nbytes /= 1024
    return f"{nbytes:.1f}PB"


if __name__ == "__main__":
    print("=" * 60)
    print("  Shell MCP Server v0.03 — Friend Edition")
    print("=" * 60)
    print(f"  Port: 9001 | Transport: streamable-http")
    print(f"  Endpoint: http://0.0.0.0:9001/mcp")
    print("=" * 60)
    mcp.run(transport="streamable-http")
SHELLMCP_EOF

ok "Shell MCP server written ($(wc -l < "$TMPDIR/shell-mcp-server.py") lines)"

# ----- PROVISIONING SCRIPT (runs on Vast instance) -----
cat > "$TMPDIR/provision.sh" << 'PROVISION_EOF'
#!/bin/bash
###############################################################################
# COMFYUI MCP PROVISIONING — FRIEND EDITION
# Runs ON the Vast.ai instance after boot
# Uses quick Cloudflare tunnels (no account needed)
###############################################################################

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

COMFYUI_DIR="/workspace/ComfyUI"
COMFYUI_PORT=18188
COMFYUI_MCP_PORT=9000
SHELL_MCP_PORT=9001
RETRY_MAX=3

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${CYAN}ℹ  $1${NC}"; }
step() { echo -e "\n${CYAN}${BOLD}[$1/9] $2${NC}"; }

echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  COMFYUI MCP PROVISIONING — FRIEND EDITION${NC}"
echo -e "${BOLD}================================================${NC}"

# Remove template provisioning lock
[ -f "/.provisioning" ] && rm -f /.provisioning

# Detect Python
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
apt-get install -y -qq git aria2 wget curl supervisor > /dev/null 2>&1
ok "System deps installed"

###############################################################################
step 2 "Installing cloudflared"
###############################################################################
if command -v cloudflared &>/dev/null; then
    ok "cloudflared already installed"
else
    ARCH=$(uname -m)
    case $ARCH in
        x86_64|amd64) CF_ARCH="amd64" ;;
        aarch64|arm64) CF_ARCH="arm64" ;;
        *) fail "Unsupported arch: $ARCH"; exit 1 ;;
    esac
    curl -sL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    ok "cloudflared installed"
fi

###############################################################################
step 3 "Installing ComfyUI (if not present)"
###############################################################################
if [ -d "$COMFYUI_DIR" ] && [ -f "$COMFYUI_DIR/main.py" ]; then
    ok "ComfyUI already installed at $COMFYUI_DIR"
else
    info "Cloning ComfyUI..."
    cd /workspace
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
    $PIP install -r requirements.txt --break-system-packages -q 2>/dev/null
    ok "ComfyUI installed"
fi

###############################################################################
step 4 "Installing ComfyUI MCP server"
###############################################################################
if [ -d "/workspace/comfyui-mcp-server" ]; then
    ok "ComfyUI MCP already cloned"
else
    cd /workspace && git clone https://github.com/joenorton/comfyui-mcp-server.git
    ok "Cloned ComfyUI MCP"
fi

cd /workspace/comfyui-mcp-server
$PIP install -r requirements.txt --break-system-packages -q 2>/dev/null
$PIP install mcp --break-system-packages -q 2>/dev/null
ok "MCP dependencies installed"

# Patch DNS rebinding protection
if grep -q "enable_dns_rebinding_protection=False" /workspace/comfyui-mcp-server/server.py 2>/dev/null; then
    ok "DNS rebinding patch already applied"
else
    LINE=$(grep -n 'mcp.run(transport="streamable-http")' /workspace/comfyui-mcp-server/server.py | tail -1 | cut -d: -f1)
    if [ -n "$LINE" ]; then
        sed -i "${LINE}s|.*|        from mcp.server.transport_security import TransportSecuritySettings\n        mcp.settings.transport_security = TransportSecuritySettings(enable_dns_rebinding_protection=False)\n        mcp.run(transport=\"streamable-http\")|" /workspace/comfyui-mcp-server/server.py
        ok "DNS rebinding protection patched"
    else
        warn "Could not patch DNS rebinding — tunnel may reject requests"
    fi
fi

###############################################################################
step 5 "Installing Shell MCP server"
###############################################################################
SHELL_DIR="/workspace/shell-mcp-server"
mkdir -p "$SHELL_DIR"
# The shell-mcp-server.py was SCP'd here by the launcher script
if [ -f "/tmp/shell-mcp-server.py" ]; then
    cp /tmp/shell-mcp-server.py "$SHELL_DIR/server.py"
    chmod +x "$SHELL_DIR/server.py"
    ok "Shell MCP server installed from uploaded file"
elif [ -f "$SHELL_DIR/server.py" ]; then
    ok "Shell MCP server already exists"
else
    fail "Shell MCP server.py not found! Should have been SCP'd to /tmp/"
    exit 1
fi

###############################################################################
step 6 "Downloading model (if needed)"
###############################################################################
CHECKPOINT_DIR="${COMFYUI_DIR}/models/checkpoints"
mkdir -p "$CHECKPOINT_DIR"

# Check if any checkpoint exists
EXISTING_MODELS=$(find "$CHECKPOINT_DIR" -name "*.safetensors" -size +100M 2>/dev/null | wc -l)

if [ "$EXISTING_MODELS" -gt 0 ]; then
    ok "Found $EXISTING_MODELS existing model(s)"
    ls -lh "$CHECKPOINT_DIR"/*.safetensors 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}'
else
    # Try CivitAI first (better model), fall back to HuggingFace
    CIVITAI_TOKEN="__CIVITAI_TOKEN__"
    if [ -n "$CIVITAI_TOKEN" ] && [ "$CIVITAI_TOKEN" != "__CIVITAI_TOKEN__" ]; then
        info "Downloading RealVisXL V5.0 Lightning from CivitAI (6.5GB)..."
        cd "$CHECKPOINT_DIR"
        aria2c -x 16 -s 16 --max-tries=3 --retry-wait=5 --console-log-level=warn \
            -o "RealVisXL_V5.0_Lightning.safetensors" \
            "https://civitai.com/api/download/models/798204?type=Model&format=SafeTensor&size=full&fp=fp16&token=${CIVITAI_TOKEN}" 2>/dev/null && \
            ok "RealVisXL downloaded" || warn "CivitAI download failed"
    fi

    # Check again — if CivitAI failed or no token, use free HuggingFace model
    EXISTING_MODELS=$(find "$CHECKPOINT_DIR" -name "*.safetensors" -size +100M 2>/dev/null | wc -l)
    if [ "$EXISTING_MODELS" -eq 0 ]; then
        info "Downloading DreamShaper XL Lightning from HuggingFace (free, 6.5GB)..."
        cd "$CHECKPOINT_DIR"
        aria2c -x 16 -s 16 --max-tries=3 --retry-wait=5 --console-log-level=warn \
            -o "DreamShaperXL_Lightning.safetensors" \
            "https://huggingface.co/Lykon/dreamshaper-xl-v2-turbo/resolve/main/DreamShaperXL_Turbo_v2_1.safetensors" 2>/dev/null && \
            ok "DreamShaper XL downloaded" || warn "Model download failed — you can add models later"
    fi
fi

###############################################################################
step 7 "Disabling template tunnel manager"
###############################################################################
supervisorctl stop tunnel_manager 2>/dev/null || true
if [ -f /etc/supervisor/conf.d/tunnel_manager.conf ]; then
    sed -i 's/autostart=true/autostart=false/' /etc/supervisor/conf.d/tunnel_manager.conf 2>/dev/null || true
fi
for f in /etc/supervisor/supervisord.conf /etc/supervisor/conf.d/*.conf; do
    if grep -q "\[program:tunnel_manager\]" "$f" 2>/dev/null; then
        sed -i '/\[program:tunnel_manager\]/,/^\[/{s/autostart=true/autostart=false/}' "$f" 2>/dev/null || true
    fi
done
supervisorctl reread 2>/dev/null || true
supervisorctl update 2>/dev/null || true
ok "Template tunnel manager disabled"

pkill -f "comfyui-mcp-server/server.py" 2>/dev/null || true
pkill -f "shell-mcp-server/server.py" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true
sleep 2

###############################################################################
step 8 "Writing supervisord config + starting services"
###############################################################################

# Write supervisor config for MCP processes only (template manages ComfyUI)
cat > /etc/supervisor/conf.d/friend-mcp.conf << SUPEOF
[program:comfyui-mcp]
command=${PYTHON} /workspace/comfyui-mcp-server/server.py
directory=/workspace/comfyui-mcp-server
environment=COMFYUI_URL="http://localhost:${COMFYUI_PORT}",MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION="false"
autostart=true
autorestart=true
startretries=10
startsecs=5
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
stdout_logfile=/tmp/mcp-shell.log
stderr_logfile=/tmp/mcp-shell.log
redirect_stderr=true
SUPEOF

supervisorctl reread
supervisorctl update
sleep 5
ok "MCP processes started via supervisord"

# Wait for ComfyUI
info "Waiting for ComfyUI to be ready..."
for i in $(seq 1 60); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" -m 3 http://localhost:${COMFYUI_PORT} 2>/dev/null)
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "403" ]; then
        ok "ComfyUI ready"
        break
    fi
    sleep 5
done

# Wait for MCP servers
sleep 5
for svc in "ComfyUI MCP:$COMFYUI_MCP_PORT" "Shell MCP:$SHELL_MCP_PORT"; do
    NAME=$(echo $svc | cut -d: -f1)
    PORT=$(echo $svc | cut -d: -f2)
    for attempt in $(seq 1 5); do
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
            -X POST http://127.0.0.1:${PORT}/mcp \
            -H "Content-Type: application/json" \
            -H "Accept: application/json, text/event-stream" \
            -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)
        if [ "$HTTP" = "200" ]; then
            ok "${NAME}: port ${PORT} ✅"
            break
        fi
        sleep 3
    done
done

###############################################################################
step 9 "Starting Cloudflare quick tunnels"
###############################################################################
info "Starting quick tunnels (no Cloudflare account needed)..."

# Start tunnel for ComfyUI MCP
cloudflared tunnel --url http://localhost:${COMFYUI_MCP_PORT} --no-autoupdate > /tmp/tunnel-comfyui.log 2>&1 &
TUNNEL_PID_COMFY=$!

# Start tunnel for Shell MCP
cloudflared tunnel --url http://localhost:${SHELL_MCP_PORT} --no-autoupdate > /tmp/tunnel-shell.log 2>&1 &
TUNNEL_PID_SHELL=$!

# Wait for tunnel URLs to appear in logs
info "Waiting for tunnel URLs (up to 30s)..."
COMFYUI_TUNNEL=""
SHELL_TUNNEL=""

for i in $(seq 1 30); do
    if [ -z "$COMFYUI_TUNNEL" ]; then
        COMFYUI_TUNNEL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel-comfyui.log 2>/dev/null | head -1)
    fi
    if [ -z "$SHELL_TUNNEL" ]; then
        SHELL_TUNNEL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel-shell.log 2>/dev/null | head -1)
    fi
    if [ -n "$COMFYUI_TUNNEL" ] && [ -n "$SHELL_TUNNEL" ]; then
        break
    fi
    sleep 1
done

# Write tunnel URLs to file for retrieval
cat > /tmp/tunnel_urls.txt << URLEOF
COMFYUI_TUNNEL=${COMFYUI_TUNNEL:-FAILED}
SHELL_TUNNEL=${SHELL_TUNNEL:-FAILED}
COMFYUI_MCP=${COMFYUI_TUNNEL:-FAILED}/mcp
SHELL_MCP=${SHELL_TUNNEL:-FAILED}/mcp
TUNNEL_PID_COMFY=$TUNNEL_PID_COMFY
TUNNEL_PID_SHELL=$TUNNEL_PID_SHELL
URLEOF

echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  PROVISIONING COMPLETE${NC}"
echo -e "${BOLD}================================================${NC}"

if [ -n "$COMFYUI_TUNNEL" ]; then
    echo -e "${GREEN}  ComfyUI MCP: ${COMFYUI_TUNNEL}/mcp${NC}"
else
    echo -e "${RED}  ComfyUI MCP tunnel: FAILED${NC}"
fi

if [ -n "$SHELL_TUNNEL" ]; then
    echo -e "${GREEN}  Shell MCP:   ${SHELL_TUNNEL}/mcp${NC}"
else
    echo -e "${RED}  Shell MCP tunnel: FAILED${NC}"
fi

echo -e "${BOLD}================================================${NC}"

PROVISION_EOF

# Inject CivitAI token if provided
if [ -n "$CIVITAI_TOKEN" ]; then
    sed -i "s|__CIVITAI_TOKEN__|$CIVITAI_TOKEN|g" "$TMPDIR/provision.sh"
fi

ok "Provisioning script written ($(wc -l < "$TMPDIR/provision.sh") lines)"

###############################################################################
# STEP 8: DEPLOY TO INSTANCE
###############################################################################
header "STEP 8: Deploying to Cloud GPU"

log "Uploading files to instance..."
scp $SSH_OPTS -P "$SSH_PORT" "$TMPDIR/shell-mcp-server.py" root@"$SSH_HOST":/tmp/shell-mcp-server.py 2>/dev/null
ok "Shell MCP server uploaded"

scp $SSH_OPTS -P "$SSH_PORT" "$TMPDIR/provision.sh" root@"$SSH_HOST":/tmp/provision.sh 2>/dev/null
ok "Provisioning script uploaded"

log "Running provisioning (this takes 2-5 minutes)..."
echo ""
ssh $SSH_OPTS -p "$SSH_PORT" root@"$SSH_HOST" "chmod +x /tmp/provision.sh && bash /tmp/provision.sh" 2>/dev/null

###############################################################################
# STEP 9: RETRIEVE TUNNEL URLS
###############################################################################
header "STEP 9: Getting Your MCP URLs"

TUNNEL_DATA=$(ssh $SSH_OPTS -p "$SSH_PORT" root@"$SSH_HOST" "cat /tmp/tunnel_urls.txt 2>/dev/null" 2>/dev/null)

COMFYUI_MCP_URL=$(echo "$TUNNEL_DATA" | grep "COMFYUI_MCP=" | cut -d= -f2-)
SHELL_MCP_URL=$(echo "$TUNNEL_DATA" | grep "SHELL_MCP=" | cut -d= -f2-)

if [ -z "$COMFYUI_MCP_URL" ] || echo "$COMFYUI_MCP_URL" | grep -q "FAILED"; then
    err "ComfyUI tunnel failed. Check instance logs manually."
    COMFYUI_MCP_URL="FAILED — check /tmp/tunnel-comfyui.log on instance"
fi

if [ -z "$SHELL_MCP_URL" ] || echo "$SHELL_MCP_URL" | grep -q "FAILED"; then
    err "Shell tunnel failed. Check instance logs manually."
    SHELL_MCP_URL="FAILED — check /tmp/tunnel-shell.log on instance"
fi

# Health check the tunnels
log "Verifying MCP endpoints through tunnels..."
for url_name in "ComfyUI:$COMFYUI_MCP_URL" "Shell:$SHELL_MCP_URL"; do
    NAME=$(echo "$url_name" | cut -d: -f1)
    URL=$(echo "$url_name" | cut -d: -f2-)
    if echo "$URL" | grep -q "FAILED"; then continue; fi
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$URL" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' 2>/dev/null)
    if [ "$HTTP" = "200" ]; then
        ok "$NAME MCP: 200 ✅ verified through tunnel"
    else
        warn "$NAME MCP: HTTP $HTTP (may need a minute to stabilize)"
    fi
done

###############################################################################
# STEP 10: PRINT SETUP INSTRUCTIONS
###############################################################################
header "🎉 SETUP COMPLETE — NOW CONNECT CLAUDE.AI"

echo -e "${BOLD}${YELLOW}Your cloud GPU is running and MCP servers are live!${NC}"
echo -e "${BOLD}${YELLOW}Now connect them to Claude.ai:${NC}"
echo ""

echo -e "${BOLD}━━━ STEP A: Add MCP Connectors ━━━${NC}"
echo ""
echo "  1. Go to ${CYAN}https://claude.ai${NC}"
echo "  2. Click your profile icon → ${BOLD}Settings${NC}"
echo "  3. Scroll to ${BOLD}Integrations${NC} (or Features → MCP Servers)"
echo "  4. Click ${BOLD}Add${NC} and add these TWO connectors:"
echo ""
echo -e "  ${BOLD}Connector 1:${NC}"
echo -e "    Name: ${CYAN}ComfyUI MCP${NC}"
echo -e "    URL:  ${GREEN}${BOLD}$COMFYUI_MCP_URL${NC}"
echo ""
echo -e "  ${BOLD}Connector 2:${NC}"
echo -e "    Name: ${CYAN}Shell MCP${NC}"
echo -e "    URL:  ${GREEN}${BOLD}$SHELL_MCP_URL${NC}"
echo ""

echo -e "${BOLD}━━━ STEP B: Test It ━━━${NC}"
echo ""
echo "  1. Start a ${BOLD}new conversation${NC} in Claude.ai"
echo "  2. You should see the MCP tools loaded (look for the 🔧 icon)"
echo "  3. Try: ${CYAN}\"Generate an image of a sunset over mountains\"${NC}"
echo "  4. Claude will use ComfyUI to generate the image!"
echo ""

echo -e "${BOLD}━━━ USEFUL COMMANDS ━━━${NC}"
echo ""
echo "  SSH into your instance:"
echo -e "    ${CYAN}ssh -i $SSH_KEY -p $SSH_PORT root@$SSH_HOST${NC}"
echo ""
echo "  Check MCP status:"
echo -e "    ${CYAN}ssh -i $SSH_KEY -p $SSH_PORT root@$SSH_HOST 'supervisorctl status all'${NC}"
echo ""
echo "  View ComfyUI MCP logs:"
echo -e "    ${CYAN}ssh -i $SSH_KEY -p $SSH_PORT root@$SSH_HOST 'tail -20 /tmp/mcp-comfyui.log'${NC}"
echo ""

echo -e "${BOLD}━━━ ⚠️  IMPORTANT ━━━${NC}"
echo ""
echo -e "  ${RED}${BOLD}BILLING:${NC} Your GPU costs ${BOLD}$GPU_PRICE/hr${NC}. Destroy it when done:"
echo -e "    ${CYAN}https://console.vast.ai/instances/${NC}"
echo -e "    Click the ❌ next to instance ${BOLD}$INSTANCE_ID${NC}"
echo ""
echo -e "  ${YELLOW}${BOLD}TUNNEL URLS:${NC} These URLs are temporary. If you destroy the"
echo "  instance and create a new one, you'll get new URLs and need"
echo "  to update the MCP connectors in Claude.ai settings."
echo ""
echo -e "  ${YELLOW}${BOLD}SSH KEY:${NC} A temporary SSH key was created at:"
echo -e "    ${CYAN}$SSH_KEY${NC}"
echo "  It will be deleted when this terminal closes. To keep it:"
echo -e "    ${CYAN}cp $SSH_KEY ~/.ssh/vast_key && cp ${SSH_KEY}.pub ~/.ssh/vast_key.pub${NC}"
echo ""

# Offer to save the SSH key
read -p "$(echo -e ${BOLD})Save SSH key to ~/.ssh/vast_key? (y/N): $(echo -e ${NC})" SAVE_KEY
if [ "$SAVE_KEY" = "y" ] || [ "$SAVE_KEY" = "Y" ]; then
    mkdir -p ~/.ssh
    cp "$SSH_KEY" ~/.ssh/vast_key
    cp "${SSH_KEY}.pub" ~/.ssh/vast_key.pub
    chmod 600 ~/.ssh/vast_key
    ok "SSH key saved to ~/.ssh/vast_key"
    echo -e "  Future SSH: ${CYAN}ssh -i ~/.ssh/vast_key -p $SSH_PORT root@$SSH_HOST${NC}"
fi

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  You're all set! Go generate some images with Claude! 🎨${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
