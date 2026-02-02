# 🧠 COMFYUI-MCP-BRAIN.md
## Project Brain — ComfyUI + Vast.ai + MCP Infrastructure
### Last Updated: 2026-02-01
### Version: 2.0.1

---

## ⚡ CURRENT STATE (Short-Term — Updated Every Session)

### Session: 2026-02-01 (Evening)

### What Was Accomplished This Session
1. Built v0.07 provisioning script with supervisord auto-restart
2. Fixed supervisord collision with Vast comfy template (reread/update, not restart)
3. Fixed supervisor detection (pgrep -f, not pgrep -x)
4. Fixed DNS rebinding "Invalid Host header" (sed patch on server.py, env var alone insufficient)
5. Killed template's tunnel_manager that was conflicting with our Cloudflare tunnel
6. Both MCPs confirmed 200 through Cloudflare tunnel
7. Image generation tested successfully (RealVisXL Lightning on A100)
8. Both MCP connectors added in Claude.ai settings (ComfyUI + Shell)
9. Brain restructured: BRAIN.md → COMFYUI-MCP-BRAIN.md, tiered architecture

### Last Known Instance
- **Instance ID:** 30838160
- **GPU:** A100 SXM4 80GB
- **Location:** Massachusetts, USA
- **Cost:** $0.83/hr
- **Image:** vastai/comfy:v0.10.0-cuda-12.9-py312
- **Status at session end:** RUNNING — but this is a Vast instance, it may be destroyed by now

### Last Known MCP Status
| Server | Local | Tunnel | Claude.ai |
|--------|-------|--------|-----------|
| ComfyUI MCP | localhost:9000 ✅ | mcp.comfyui-mcp.uk ✅ | Connected as "Vast MCP" |
| Shell MCP | localhost:9001 ✅ | sh.comfyui-mcp.uk ✅ | Connected as "comfyui-mcp" |

### What Still Needs Doing
- [ ] Verify Shell MCP tools actually load (need new conversation — tools load at chat start)
- [ ] Test full lifecycle: no instance → recovery command → both MCPs live
- [ ] Model manifest system (download profiles: sdxl, wan22, flux)
- [ ] Output persistence (auto-sync generations to cloud storage)
- [ ] Claude-initiated instance launcher ("spin me up a 4090")

### ⚠️ BEFORE DOING ANYTHING — CHECK INSTANCE STATUS
The instance may be dead. First action every session:
```bash
VAST_TOKEN="339786fe805ebc1c56f2b44bcec4b82aa0bf9f52247af363ff4711783b96e926"
curl -s -H "Authorization: Bearer $VAST_TOKEN" "https://console.vast.ai/api/v0/instances?owner=me" | python3 -c "
import sys,json
instances = json.load(sys.stdin).get('instances',[])
if not instances:
    print('NO INSTANCES RUNNING — need to create one')
else:
    for i in instances:
        print(f'ID: {i["id"]} | GPU: {i.get("gpu_name","?")} | Status: {i.get("actual_status","?")} | Cost: \${i.get("dph_total",0):.2f}/hr')
"
```

If no instance is running, ask Matt before creating one. Then use the recovery commands below.

---

## 🔧 RECOVERY COMMANDS (Reference — DO NOT auto-execute)

These commands get back to full operational state. Wait for Matt's go-ahead before running any of them.

### If Instance Is Dead — Create New One
```bash
# Step 1: Search for GPU (budget $1/hr, 24GB+ VRAM, 500Mbps+ download)
VAST_TOKEN="339786fe805ebc1c56f2b44bcec4b82aa0bf9f52247af363ff4711783b96e926"
curl -s -H "Authorization: Bearer $VAST_TOKEN" \
  "https://console.vast.ai/api/v0/bundles?q=%7B%22rentable%22%3A%7B%22eq%22%3Atrue%7D%2C%22dph_total%22%3A%7B%22lte%22%3A1.0%7D%2C%22gpu_ram%22%3A%7B%22gte%22%3A24%7D%2C%22inet_down%22%3A%7B%22gte%22%3A500%7D%2C%22reliability2%22%3A%7B%22gte%22%3A0.95%7D%2C%22num_gpus%22%3A%7B%22eq%22%3A1%7D%2C%22order%22%3A%5B%5B%22dph_total%22%2C%22asc%22%5D%5D%7D&limit=5"

# Step 2: Create instance (replace {OFFER_ID} with best result from step 1)
curl -s -X PUT -H "Authorization: Bearer $VAST_TOKEN" \
  "https://console.vast.ai/api/v0/asks/{OFFER_ID}/" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "me",
    "image": "vastai/comfy:v0.10.0-cuda-12.9-py312",
    "disk": 80,
    "runtype": "jupyter_direct",
    "onstart": "curl -sL https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude/vast-mcp-setup-v0.07.sh | bash"
  }'

# Step 3: Wait ~4 minutes. Provisioning is automatic via onstart.
# Step 4: Health check both endpoints
curl -s -o /dev/null -w "%{http_code}" -X POST https://mcp.comfyui-mcp.uk/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
curl -s -o /dev/null -w "%{http_code}" -X POST https://sh.comfyui-mcp.uk/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
```

### If Instance Is Running But MCPs Are Down
```bash
# Option A: Re-run full provisioning (safe, idempotent)
curl -sL https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude/vast-mcp-setup-v0.07.sh | bash

# Option B: Quick restart (if everything is already installed)
/workspace/start-mcps.sh

# Option C: Targeted restart via supervisord
supervisorctl restart comfyui-mcp shell-mcp cloudflared
```

### If DNS Rebinding Error Returns (421 or "Invalid Host header")
```bash
# Patch server.py and restart
LINE=$(grep -n 'mcp.run(transport="streamable-http")' /workspace/comfyui-mcp-server/server.py | tail -1 | cut -d: -f1)
sed -i "${LINE}s|.*|        from mcp.server.transport_security import TransportSecuritySettings\n        mcp.settings.transport_security = TransportSecuritySettings(enable_dns_rebinding_protection=False)\n        mcp.run(transport=\"streamable-http\")|" /workspace/comfyui-mcp-server/server.py
supervisorctl restart comfyui-mcp
```

---

## 🔌 MCP ARCHITECTURE

### Dual MCP Architecture (ACHIEVED ✅)
Two servers on Vast.ai, exposed via Cloudflare named tunnel, connected to Claude.ai.

| Server | Port | Endpoint | Source |
|--------|------|----------|--------|
| **ComfyUI MCP** | 9000 | `https://mcp.comfyui-mcp.uk/mcp` | joenorton/comfyui-mcp-server |
| **Shell MCP** | 9001 | `https://sh.comfyui-mcp.uk/mcp` | Custom: shell-mcp-server-v0.03.py |

### ComfyUI MCP Tools
generate_image, generate_song, view_image, list_workflows, run_workflow, regenerate, get_queue_status, cancel_job, list_models, get_defaults, set_defaults, list_assets, get_asset_metadata, publish_asset

### Shell MCP Tools (17 total)
run_command, read_file, write_file, append_file, list_directory, file_info, delete_path, move_path, upload_base64, download_base64, process_list, kill_process, disk_usage, system_info, gpu_info, install_package, environment

### Cloudflare Tunnel
- **Tunnel ID:** 73cb30f7-2d3a-4a2c-aefb-bcee8ddee39d
- **Domain:** comfyui-mcp.uk
- **Account:** matthewsroy@gmail.com (free Zero Trust, team: lytcomm)
- **Config:** Multi-host ingress — shell → :9001, mcp → :9000, catch-all → 404
- **Startup:** `cloudflared tunnel run comfyui-mcp` (reads config.yml)
- **Creds:** /root/.cloudflared/cert.pem + {tunnel_id}.json

### Technical Notes
- DNS rebinding protection MUST be patched in server.py (TransportSecuritySettings)
- Env var alone (`MCP_TRANSPORT_SECURITY__ENABLE_DNS_REBINDING_PROTECTION=false`) is NOT sufficient
- v0.07 uses `sed` to patch the actual `mcp.run()` call in server.py
- `COMFYUI_URL` env var (NOT COMFYUI_HOST) → `http://localhost:18188`
- Vast comfy template: ComfyUI on 18188, Caddy proxies to 8188 externally
- Template runs its own `tunnel_manager` — MUST be stopped/disabled or it conflicts with our tunnel
- Template runs its own `supervisord` — v0.07 detects this and uses `reread/update` instead of starting fresh
- Shell MCP v0.02 required for mcp lib 1.26.0 compatibility

### Provisioning Script History
| Version | Key Changes |
|---------|-------------|
| v0.02 | Initial single-MCP setup |
| v0.03 | Added model downloads |
| v0.04 | Added Shell MCP |
| v0.05 | Dual MCP, multi-host tunnel, 10 steps |
| v0.06 | Self-contained (no template dependency), DNS rebinding patch |
| v0.07 | Supervisord auto-restart, template detection, tunnel_manager kill, sed-based DNS patch |

---

## 🤖 COMFYUI CONFIGURATION

### Vast.ai Preferences
- **Budget:** $1/hr max — ALWAYS ask before renting or deleting
- **GPU priority:** PRO 6000, A100, H100 — NO consumer 4090s
- **DL speed is CRITICAL** for initial setup
- **Base image:** `vastai/comfy:v0.10.0-cuda-12.9-py312` (pre-cached, boots fast)
- **Alt image:** Bare pytorch (NOT recommended — slow boot, not pre-cached)
- **Path:** `/workspace/ComfyUI/`
- **Instances are DISPOSABLE** — everything from one script

### Model Inventory

#### Checkpoints — `/workspace/ComfyUI/models/checkpoints/`
- RealVisXL_V5.0_Lightning.safetensors (SDXL, 6 steps, fast)

#### Diffusion Models (GGUF) — `/workspace/ComfyUI/models/diffusion_models/`
- SmoothMix Wan 2.2 I2V High Noise (GGUF)
- SmoothMix Wan 2.2 I2V Low Noise (GGUF)
- Wan 2.2 Remix NSFW High (v0.08a)
- Wan 2.2 Remix NSFW Low (v0.08a)

#### Text Encoders — `/workspace/ComfyUI/models/text_encoders/`
- umt5_xxl_fp16.safetensors (full quality)
- umt5_xxl_fp8_e4m3fn_scaled.safetensors (balanced)
- umt5-xxl-encoder-Q8_0.gguf (GGUF)

#### VAE — `/workspace/ComfyUI/models/vae/`
- Wan 2.1 FP32 VAE

#### LoRAs — `/workspace/ComfyUI/models/loras/`
- LightX2V 4-step high noise + low noise
- lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16
- 30+ CivitAI style/NSFW LoRAs

#### CLIP Vision — `/workspace/ComfyUI/models/clip_vision/`
- siglip-so400m-patch14-384/ (for Shakker-Labs IP-Adapter)

#### Face Swap
- inswapper_128.onnx
- restoreformer_plus_plus.pth
- GPEN-BFR-2048

### Custom Nodes
| Node | Source | Purpose |
|------|--------|---------|
| ComfyUI-GGUF | city96 | GGUF model loader |
| ComfyUI-Manager | ltdrdata | Node/model management |
| comfyui-reactor-node | Gourieff | Face swapping |
| comfyui-ollama | — | LLM integration |
| ComfyUI-IPAdapter-Flux | Shakker-Labs | IP-Adapter for FLUX |
| ComfyUI-IDM-VTON | Matt's fork | Virtual try-on |
| RES4LYF | — | Advanced 3-stage sampling |
| VHS_VideoCombine | — | Video output |
| RIFE | — | Frame interpolation |
| Impact Pack | — | Face detection/segmentation |
| comfyui_controlnet_aux | — | ControlNet preprocessors |
| DWPose | — | Pose estimation (needs numpy<2) |

### Preferred Settings

**Wan 2.2 I2V:**
| Setting | Value |
|---------|-------|
| Sampler | uni_pc |
| Scheduler | simple |
| CFG | 1.0 - 3.0 (LOW!) |
| Steps | 4-8 (with LightX2V) or 20-30 (without) |
| Shift | 5 |
| Resolution | 640x640 or 720p |

**RealVisXL Lightning (SDXL):**
| Setting | Value |
|---------|-------|
| Sampler | dpmpp_2m_sde |
| Scheduler | karras |
| CFG | 2.0 |
| Steps | 6 |
| Resolution | 1024x1024 |

**ReActor Face Swap:**
| Setting | Value |
|---------|-------|
| Swap Model | inswapper_128.onnx |
| Detector | retinaface_resnet50 |
| Restorer | restoreformer_plus_plus.pth |
| Boost Factor | 1.5 - 2.0 |
| Pipeline | Generate → Swap → Boost → Color Match → Output |

---

## 🎬 ACTIVE PROJECTS

### Grok Director System
- AI director (xAI Grok API) controlling ComfyUI workflows via chat
- Memory, vision feedback loop, LoRA auto-selection, multi-character support
- **Status:** Design phase

### TastySinI2V Custom Node Pack
- Simplified I2V node (Loader, Sampler, Output, Looper)
- GGUF model loading, Wan 2.2 pipeline
- **Status:** Installed, functional

---

## 🐛 TROUBLESHOOTING REFERENCE

| Issue | Fix |
|-------|-----|
| NumPy 2.x + onnxruntime | `pip install "numpy<2" --break-system-packages` |
| ComfyUI-GGUF import path | Folder uses hyphen: `ComfyUI-GGUF` not `ComfyUI_GGUF` |
| CivitAI download auth redirect | Two-step: get redirect URL with auth, download without |
| DNS rebinding "Invalid Host header" | Patch server.py with TransportSecuritySettings, not just env var |
| Supervisord collision on template | Use `reread/update`, never `supervisord -c` on running instance |
| tunnel_manager conflict | `supervisorctl stop tunnel_manager` + set autostart=false |
| Supervisor detection fails | Use `pgrep -f supervisord` not `pgrep -x` or `supervisorctl status` |
| SigLIP shows UNKNOWN | Download full model directory structure |
| DWPose node failure | NumPy version conflict — same fix as onnxruntime |
| Ollama chat trap | Exit with `/bye` before terminal commands |
| Instance "No such container" | Bare pytorch image not pre-cached — use comfy template instead |
| ComfyUI MCP `python -m` | Wrong. Use `python server.py` directly |
| Shell MCP mcp 1.26.0 | Need v0.02 of shell-mcp-server |

---

## 📁 FILE INVENTORY (GitHub: .claude/)

| File | Purpose | Current Version |
|------|---------|----------------|
| MASTER-BRAIN.md | God brain — universal knowledge | v1.0.2 |
| COMFYUI-MCP-BRAIN.md | This file — project brain | v2.0.0 |
| vast-mcp-setup-v0.07.sh | Provisioning script | v0.07 |
| shell-mcp-server-v0.03.py | Shell MCP server | v0.02 |
| start-mcps.sh | Mid-session MCP restart | v0.01 |
| vast-model-download-v0.01.sh | Model download script | v0.01 |
| PROJECT-INSTRUCTIONS-v0.02.md | Claude Project bootstrap | v0.02 |

---

## 🔄 CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0.0 | Initial brain (as BRAIN.md) |
| 2026-02-01 | 1.1.0 | MCP server on Vast, COMFYUI_URL fix |
| 2026-02-01 | 1.2.0 | Dual MCP achieved, Shell MCP v0.01, setup v0.05 |
| 2026-02-01 | 2.0.0 | **RENAMED** BRAIN.md → COMFYUI-MCP-BRAIN.md. Restructured with Current State section. Added v0.07 provisioning (supervisord, template detection, DNS rebinding sed patch, tunnel_manager kill). Full troubleshooting reference. File inventory. |
| 2026-02-01 | 2.0.1 | Updated CURRENT STATE as session handoff briefing. Recovery commands as reference (not auto-execute). Added instance status check. |

---

*This is the ComfyUI + MCP project brain. Fetch at conversation start when doing AI/ComfyUI/Vast work. Update after every meaningful session.*



---

## 🔒 LOCKED COMPONENTS — DO NOT MODIFY

**These components are PROVEN WORKING after extensive debugging. Changing ANY of them will break the MCP stack. Do NOT touch without Matt's explicit approval.**

### 1. shell-mcp-server-v0.03.py
- **LOCKED:** `stateless_http=True` in FastMCP constructor
- **WHY:** Without this, Claude.ai cannot discover tools (session-id header issue)
- **DO NOT:** Remove stateless_http, change port 9001, rename the file, or "upgrade" to a newer pattern

### 2. vast-mcp-setup-v0.07.sh
- **LOCKED:** Entire provisioning flow
- **WHY:** Zero-touch automated setup that works on any Vast instance
- **DO NOT:** Rewrite from scratch, change step order, or "simplify" — iterate as v0.08+ only

### 3. Cloudflare Tunnel Config
- **LOCKED:** Ingress routing structure
- **WHY:** Routes sh.comfyui-mcp.uk → port 9001, mcp.comfyui-mcp.uk → port 9000
- **DO NOT:** Change hostnames, ports, or tunnel ID

### 4. Connector URLs in Claude.ai
- **LOCKED:** `https://sh.comfyui-mcp.uk/mcp` (Shell MCP) and `https://mcp.comfyui-mcp.uk/mcp` (ComfyUI MCP)
- **WHY:** Fresh subdomain `sh.` bypassed Claude.ai's cached failure. `shell.` is poisoned.
- **DO NOT:** Suggest changing back to shell.comfyui-mcp.uk or removing /mcp suffix

### 5. FastMCP Constructor Pattern
- **LOCKED:** Both servers use `stateless_http=True` with `transport="streamable-http"`
- **WHY:** Claude.ai doesn't propagate mcp-session-id headers between requests
- **DO NOT:** Add session management, switch to SSE transport, or remove stateless flag

### 6. Supervisord Service Names
- **LOCKED:** `comfyui-mcp`, `shell-mcp`, `cloudflared` in supervisord
- **WHY:** Scripts reference these names for restart/status checks
- **DO NOT:** Rename services or switch to systemd/manual process management

### If you need to change something locked:
1. Ask Matt first
2. Explain WHY the change is needed
3. Version increment the file (v0.04, v0.08, etc.)
4. Test BEFORE declaring success
5. Update this brain with the change

**These locks exist because it took 8+ hours of debugging across multiple sessions to get 34 tools loading in Claude.ai. Respect the locks.**

