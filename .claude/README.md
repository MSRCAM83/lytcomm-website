# 🤖 ComfyUI + Claude MCP Stack

**AI image generation directly from Claude.ai conversations — powered by cloud GPUs.**

One script. Cloud GPU. MCP servers. Secure tunnels. Done.

---

## 🚀 Quick Start (For Anyone)

**No experience needed.** Just a [Vast.ai](https://vast.ai) account with a few dollars of credit.

```bash
chmod +x comfyui-claude-setup.sh
./comfyui-claude-setup.sh
```

**That's it.** The script:
- Finds and rents the cheapest available cloud GPU
- Installs ComfyUI (AI image generation engine)
- Installs MCP servers (bridge between Claude.ai and ComfyUI)  
- Creates secure tunnels (so Claude.ai can reach your GPU)
- Gives you 2 URLs to paste into Claude.ai settings
- You start generating images by talking to Claude

📄 **[comfyui-claude-setup.sh](comfyui-claude-setup.sh)** — 1,300 lines, fully self-contained, zero external downloads

---

## 🔧 What's In The Box

### The Scripts That Matter

| Script | Who It's For | What It Does |
|--------|-------------|--------------|
| **[comfyui-claude-setup.sh](comfyui-claude-setup.sh)** | Anyone | Complete setup from zero. Interactive prompts, free model fallback, quick tunnels. |
| **[disaster-recovery-v0.02.sh](disaster-recovery-v0.02.sh)** | Matt (owner) | Full rebuild with hardcoded tokens. Zero input needed. |
| **[vast-mcp-setup-v0.07.sh](vast-mcp-setup-v0.07.sh)** | Advanced | Provisioning script that runs ON the GPU instance. Named Cloudflare tunnels. |

### Supporting Files

| File | Purpose |
|------|---------|
| [shell-mcp-server-v0.03.py](shell-mcp-server-v0.03.py) | Shell MCP server — 17 tools for full OS control via Claude |
| [start-mcps.sh](start-mcps.sh) | Quick restart script for MCP services |
| [COMFYUI-MCP-BRAIN.md](COMFYUI-MCP-BRAIN.md) | Project knowledge base (for Claude context) |
| [MASTER-BRAIN.md](MASTER-BRAIN.md) | Master knowledge base (for Claude context) |

---

## 🏗️ Architecture

```
Your Computer                    Cloud GPU (Vast.ai)
┌──────────┐                    ┌─────────────────────────┐
│ Claude.ai│◄──Cloudflare──────►│ ComfyUI MCP (port 9000) │
│          │   Tunnel           │ Shell MCP   (port 9001) │
│          │                    │ ComfyUI     (port 18188)│
│  "make   │                    │ supervisord (auto-heal) │
│  me a    │                    └─────────────────────────┘
│  sunset" │                         │
└──────────┘                         ▼
                                 🎨 Image Generated
```

**How it works:**
1. You talk to Claude in claude.ai
2. Claude calls ComfyUI MCP tools through a secure Cloudflare tunnel
3. ComfyUI generates the image on the cloud GPU
4. Image is returned to Claude and displayed in chat

**MCP Servers:**
- **ComfyUI MCP** (17 tools) — Queue generations, manage workflows, view outputs, list models
- **Shell MCP** (17 tools) — Run commands, read/write files, install packages, GPU info, process management

---

## 💰 Cost

Cloud GPU rental on Vast.ai:
- **RTX 3090** (24GB): ~$0.05-0.15/hr
- **RTX 4090** (24GB): ~$0.20-0.40/hr  
- **A100** (80GB): ~$0.50-0.80/hr
- **H100** (80GB): ~$0.60-1.50/hr

**Destroy your instance when you're done to stop billing.**

---

## 📋 Requirements

- **Vast.ai account** with credit ([sign up](https://vast.ai))
- **bash, curl, python3, ssh** (standard on Mac, Linux, WSL)
- **Claude.ai account** (free or Pro)

Optional:
- CivitAI API token (for premium models)
- HuggingFace token (for gated models)

---

## 🛠️ Troubleshooting

**MCP tools not showing in Claude?**
→ Start a NEW conversation after adding the MCP connectors. Tools load at conversation start.

**Image generation fails?**
→ SSH into your instance and check: `supervisorctl status all`

**Tunnel URLs stopped working?**
→ Quick tunnels are temporary. Re-run the setup or SSH in and restart cloudflared.

**Want to add more AI models?**
→ Ask Claude to use the Shell MCP to download models to `/workspace/ComfyUI/models/checkpoints/`

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.07 | 2026-02-02 | Supervisord process management, auto-restart on crash |
| v0.06 | 2026-02-01 | Self-contained ComfyUI install, no template dependency |
| v0.05 | 2026-02-01 | Dual MCP (ComfyUI + Shell), multi-host tunnel |
| v0.01 | 2026-01-30 | Initial provisioning script |

---

*Built by Matt Roy's AI Workshop — because talking to an AI that can generate images is better than clicking buttons in a UI.*
