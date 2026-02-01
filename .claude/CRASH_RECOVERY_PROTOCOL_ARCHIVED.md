# CLAUDE CRASH RECOVERY PROTOCOL
## For LYT Communications Project
### Updated: January 19, 2026

---

## ⚠️ READ THIS FIRST IN EVERY NEW SESSION

If you are a new Claude session working on the LYT Communications project, follow these steps BEFORE doing any work:

---

## STEP 1: Fetch BLUEPRINT.md Using Bash

**IMPORTANT:** The Zapier GitHub tools may not work. Use bash with the GitHub token from your memory:

```bash
curl -s \
  -H "Authorization: token YOUR_TOKEN_FROM_MEMORY" \
  -H "Accept: application/vnd.github.v3.raw" \
  "https://api.github.com/repos/MSRCAM83/lytcomm-website/contents/BLUEPRINT.md"
```

**The token is stored in Claude's memory.** Look for the memory item that says "GitHub token: ghp_..."

This BLUEPRINT.md file contains:
- Exact color codes
- Styling patterns (cards, buttons, inputs)
- File structure
- Component specifications
- Company info
- Rules to follow

**READ THE ENTIRE BLUEPRINT BEFORE WRITING ANY CODE.**

---

## STEP 2: Check the Work Log

```
Google Doc ID: 110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo
URL: https://docs.google.com/document/d/110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo
```

Use `google_drive_fetch` with document ID `110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo`

This document tells you:
- What the last session was working on
- Progress percentage
- Whether it completed or crashed

---

## STEP 3: Check the WIP Branch

Compare main vs claude-wip to see if there's unfinished work:

```bash
curl -s \
  -H "Authorization: token YOUR_TOKEN_FROM_MEMORY" \
  "https://api.github.com/repos/MSRCAM83/lytcomm-website/compare/main...claude-wip"
```

If claude-wip is ahead of main, there's work in progress.

---

## STEP 4: Fetch Any Specific File

To get any file from the repo:

```bash
curl -s \
  -H "Authorization: token YOUR_TOKEN_FROM_MEMORY" \
  -H "Accept: application/vnd.github.v3.raw" \
  "https://api.github.com/repos/MSRCAM83/lytcomm-website/contents/src/pages/HomePage.js"
```

Replace the path as needed.

---

## KEY RESOURCES

| Resource | How to Access |
|----------|---------------|
| GitHub Token | Claude's memory (look for "GitHub token: ghp_...") |
| BLUEPRINT.md | Bash curl with token (see Step 1) |
| Work Log | google_drive_fetch doc ID: 110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo |
| WIP Branch | Bash curl compare (see Step 3) |
| Any repo file | Bash curl with token (see Step 4) |
| Vercel deployments | Use Vercel MCP tools |

---

## RECOVERY DECISION TREE

```
1. Read BLUEPRINT.md (use bash + token from memory)
   ↓
2. Read Work Log (google_drive_fetch)
   ↓
3. Is there an active task?
   ├── YES → Check claude-wip branch, continue from there
   └── NO → Ask user what they want to work on
```

---

## GOLDEN RULES

1. **ALWAYS read BLUEPRINT.md first** - It has the design system
2. **Use bash + token for GitHub** - Zapier tools may not work
3. **Commit to claude-wip every ~100 lines** - Crash protection
4. **Update work log before AND after tasks** - Session continuity
5. **Never delete functionality** - Fix it instead
6. **Test with CI=true npm run build** - Catch ESLint errors

---

*This protocol ensures session continuity even when chats crash mid-task.*
