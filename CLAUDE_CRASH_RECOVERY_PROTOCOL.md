# CLAUDE CRASH RECOVERY PROTOCOL
## For LYT Communications Project
### Created: January 19, 2026

---

## ⚠️ READ THIS FIRST IN EVERY NEW SESSION

If you are a new Claude session working on the LYT Communications project, follow these steps BEFORE doing any work:

---

## STEP 1: Check the Work Log

```
Google Doc: CLAUDE_WORK_LOG
URL: https://docs.google.com/document/d/110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo
Folder: LYT Communications (11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC)
```

Use `google_drive_fetch` to read this document. It contains:
- What the last session was working on
- How far it got
- What files were being modified
- Whether it completed or crashed

---

## STEP 2: Check the WIP Branch

```bash
# Compare WIP branch to main
curl -s -H "Authorization: token [PAT]" \
  "https://api.github.com/repos/MSRCAM83/lytcomm-website/compare/main...claude-wip"
```

The `claude-wip` branch contains work-in-progress commits. If main and claude-wip differ, there's unfinished work.

---

## STEP 3: Determine Recovery Action

| Work Log Says | WIP Branch Status | Action |
|---------------|-------------------|--------|
| Task completed | Same as main | Start fresh, no recovery needed |
| Task in progress | Ahead of main | Resume from WIP branch |
| Task crashed mid-file | Ahead of main | Check partial commits, resume |
| Task crashed | Same as main | Check log for plan, restart task |

---

## AUTOMATED WORKFLOW FOR ALL SESSIONS

### BEFORE Starting Any Task:
1. Fetch and read CLAUDE_WORK_LOG
2. Update log with: timestamp, task description, files planned
3. Push log update to Google Drive

### DURING Task Execution:
1. Work in small chunks (max 300 lines per file section)
2. After each chunk: commit to claude-wip branch
3. Update work log with progress percentage

### AFTER Completing Task:
1. Merge claude-wip to main (or push directly if small change)
2. Update work log: mark task complete, record commit SHA
3. Verify Vercel deployment succeeded

### IF Session Is About to End:
1. Immediately commit any WIP to claude-wip
2. Update work log with exact stopping point
3. List next steps for recovery

---

## KEY RESOURCES

| Resource | Location |
|----------|----------|
| GitHub Repo | MSRCAM83/lytcomm-website |
| Main Branch | main |
| WIP Branch | claude-wip |
| Work Log | docs.google.com/document/d/110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo |
| Google Drive Folder | 11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC |
| GitHub PAT | In memory (ghp_73wJJ4...) |
| Vercel Project | lytcomm-website |
| Vercel Team ID | team_KdY24IuzstUJ0GmIFbiMTPFn |

---

## EXAMPLE RECOVERY SCENARIO

**Previous session was creating ContactPage.js and crashed mid-file**

1. Read work log → Shows "Creating ContactPage.js, 60% complete, stopped at contact form section"
2. Check claude-wip → Has partial ContactPage.js committed
3. Fetch partial file from WIP branch
4. Continue from where it stopped
5. Complete file, commit, merge to main
6. Update work log as complete

---

## MEMORY ITEMS TO VERIFY

Claude should have these in memory:
- GitHub PAT for repo access
- Google Drive folder ID
- Work log document ID
- Instruction to update work log BEFORE starting tasks

---

*This protocol ensures no work is ever lost due to session crashes.*
