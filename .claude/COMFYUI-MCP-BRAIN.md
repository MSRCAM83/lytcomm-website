# 🧠 COMFYUI-MCP-BRAIN.md
## Project Brain — ComfyUI + Vast.ai + MCP Infrastructure
### Last Updated: 2026-02-01
### Version: 2.0.0

---

## ⚡ CURRENT STATE (Short-Term — Updated Every Session)

### Active Instance
- **Instance ID:** 30838160
- **GPU:** A100 SXM4 80GB
- **Location:** Massachusetts, USA
- **Cost:** $0.83/hr
- **Image:** vastai/comfy:v0.10.0-cuda-12.9-py312
- **Status:** RUNNING ✅

### MCP Status
| Server | Local | Tunnel | Status |
|--------|-------|--------|--------|
| ComfyUI MCP | http://localhost:9000 ✅ | https://mcp.comfyui-mcp.uk/mcp ✅ | Connected in Claude.ai |
| Shell MCP | http://localhost:9001 ✅ | https://shell.comfyui-mcp.uk/mcp ✅ | Connected in Claude.ai |

### Current Task
- v0.07 provisioning script — COMPLETE ✅
- Both MCPs live through Cloudflare tunnel
- Image generation tested and working (RealVisXL Lightning on A100)
- Next: Shell MCP tools need new conversation to load

### Recent Fixes (This Session)
1. Supervisord collision with template — use `reread/update` not restart
2. Supervisor detection — `pgrep -f` not `pgrep -x`
3. DNS rebinding patch — `sed` on actual line number, not Python pattern matching
4. tunnel_manager conflict — stop + disable template's competing tunnel
5. ComfyUI MCP "Invalid Host header" — patch server.py directly

### Pending Work
- [ ] Verify Shell MCP tools load in new conversation
- [ ] Test full instance lifecycle: create → provision → both MCPs live
- [ ] Model manifest system (download profiles)
- [ ] Output persistence (sync to R2/S3/GitHub)
- [ ] Instance launcher from Claude (say "spin me up a 4090")

---

## 🔧 RECOVERY COMMAND

One command to restore full stack on any Vast.ai instance:
```bash
curl -sL https://raw.githubusercontent.com/MSRCAM83/lytcomm-website/main/.claude/vast-mcp-setup-v0.07.sh | bash
```

### Full Instance Creation Flow
```bash
# 1. Search for GPU
VAST_TOKEN="339786fe805ebc1c56f2b44bcec4b82aa0bf9f52247af363ff4711783b96e926"
curl -s -H "Authorization: Bearer $VAST_TOKEN" "https://console.vast.ai/api/v0/bundles?q={\"rentable\":{\"eq\":true},\"dph_total\":{\"lte\":1.0},\"gpu_ram\":{\"gte\":24},\"inet_down\":{\"gte\":500},\"reliability2\":{\"gte\":0.95},\"num_gpus\":{\"eq\":1},\"order\":[[\"dph_total\",\"asc\"]]}&limit=5"

# 2. Create instance (use offer ID from search)
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

# 3. Wait ~4 minutes, then both endpoints are live
```

### Mid-Session Restart (if MCPs crash)
```bash
/workspace/start-mcps.sh
# OR
supervisorctl restart comfyui-mcp shell-mcp cloudflared
```

---

## 🔌 MCP ARCHITECTURE

### Dual MCP Architecture (ACHIEVED ✅)
Two servers on Vast.ai, exposed via Cloudflare named tunnel, connected to Claude.ai.

| Server | Port | Endpoint | Source |
|--------|------|----------|--------|
| **ComfyUI MCP** | 9000 | `https://mcp.comfyui-mcp.uk/mcp` | joenorton/comfyui-mcp-server |
| **Shell MCP** | 9001 | `https://shell.comfyui-mcp.uk/mcp` | Custom: shell-mcp-server-v0.02.py |

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
| shell-mcp-server-v0.02.py | Shell MCP server | v0.02 |
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

---

*This is the ComfyUI + MCP project brain. Fetch at conversation start when doing AI/ComfyUI/Vast work. Update after every meaningful session.*
