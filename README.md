# LYT Communications Website

---

## 🤖 ComfyUI + Claude MCP Stack

**Generate AI images directly from Claude.ai conversations using cloud GPUs.**

One script sets up everything — cloud GPU, ComfyUI, MCP servers, secure tunnels.

```bash
# For anyone — interactive setup, no experience needed
chmod +x .claude/comfyui-claude-setup.sh
./.claude/comfyui-claude-setup.sh
```

👉 **[Full documentation and all scripts →](.claude/README.md)**

---

Professional website with public pages and employee portal for LYT Communications fiber optic construction company.

## Quick Deploy to Vercel (Easiest - 5 minutes)

### Step 1: Create GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click "Sign up"
3. Create your account

### Step 2: Upload This Code to GitHub
1. Go to https://github.com/new
2. Name it: `lyt-communications-website`
3. Keep it Public
4. Click "Create repository"
5. On the next page, click "uploading an existing file"
6. Drag and drop ALL files from this folder
7. Click "Commit changes"

### Step 3: Deploy on Vercel (FREE)
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel
4. Click "Add New..." → "Project"
5. Find `lyt-communications-website` and click "Import"
6. Leave all settings as default
7. Click "Deploy"
8. Wait 2-3 minutes
9. Your site is LIVE! Vercel gives you a URL like: `lyt-communications-website.vercel.app`

### Step 4: Add Your Custom Domain (Optional)
1. In Vercel, go to your project → "Settings" → "Domains"
2. Type your domain: `www.lytcomm.com`
3. Click "Add"
4. Vercel shows you DNS records to add
5. Go to your domain registrar (GoDaddy, Namecheap, etc.)
6. Add the DNS records Vercel shows you
7. Wait 10-30 minutes for DNS to update
8. Your site is now at www.lytcomm.com!

---

## File Structure

```
lyt-deploy/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── App.js              # Main website component
│   └── index.js            # React entry point
├── package.json            # Dependencies
├── vercel.json             # Deployment config
└── README.md               # This file
```

## Features

### Public Website
- Home page with hero, stats, services preview
- About page with company story and values
- Services page with all 6 service offerings
- Contact page with quote request form

### Employee Portal
- Login system with role-based access
- Dashboard with stats and announcements
- Time clock with clock in/out and break tracking
- Projects list with status filtering
- File management system
- Invoice tracking (Admin/Supervisor only)
- Team directory
- User management (Admin only)
- Light/dark mode toggle

## Demo Accounts
- Admin: matt@lytcomm.com
- Supervisor: john@lytcomm.com
- Technician: sarah@lytcomm.com
- Password: any value (demo mode)

## Next Steps After Deployment

### 1. Update Contact Info
Edit `src/App.js` and search for:
- `(409) 555-0123` - replace with real phone
- `info@lytcomm.com` - replace with real email

### 2. Update Stats
Search for these and update with real numbers:
- `15+` years
- `500+` projects
- `10K+` miles

### 3. Add Real Backend (Optional)
To make the portal functional with real data:
1. Create account at https://supabase.com
2. Set up database tables
3. Connect React app to Supabase
4. (I can help with this when you're ready)

## Brand Colors
- Blue: #0077B6
- Teal: #00B4D8
- Green: #2E994B
- Dark Blue: #023E8A

## Support
Built with React and Lucide icons. Images from Unsplash (free commercial use).
