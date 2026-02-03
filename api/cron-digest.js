/**
 * LYT Communications - Daily Compliance Digest Cron
 * Version: 1.0.0
 * 
 * Vercel cron job that runs daily at 7:00 AM CST.
 * Scans all employees/contractors for expiring compliance items
 * and emails a digest to admin team.
 * 
 * Configure in vercel.json:
 * { "crons": [{ "path": "/api/cron-digest", "schedule": "0 13 * * *" }] }
 * (13:00 UTC = 7:00 AM CST)
 */

export default async function handler(req, res) {
  // Verify this is a legitimate cron call or admin request
  const authHeader = req.headers['authorization'];
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isAdmin = req.query.key === 'LYTcomm2026DigestKey';

  if (!isCron && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Import the digest function dynamically (serverless compatible)
    // Since we can't import from src/ in Vercel serverless, we inline the logic
    const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbwiq8NzgdUQ6Hu44NHN3ASdAYTd68uK6wGRK_CpJroSoiMuv66aRmPAzDxmtXexl6MK/exec';
    const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
    const ADMIN_EMAILS = ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com'];

    const now = new Date();
    const alerts = { critical: [], urgent: [], warning: [] };
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expirationFields = [
      { headerMatch: 'coi_expiration', label: 'COI' },
      { headerMatch: 'license_expiration', label: 'Business License' },
      { headerMatch: 'vehicle_insurance_exp', label: 'Vehicle Insurance' },
      { headerMatch: 'cert_expiration', label: 'Certification' },
      { headerMatch: 'osha_expiration', label: 'OSHA Cert' },
      { headerMatch: 'flagger_cert_exp', label: 'Flagger Cert' },
    ];

    // Fetch submissions
    for (const sheet of ['Contractor Submissions', 'Employee Submissions']) {
      const type = sheet.startsWith('Contractor') ? 'Contractor' : 'Employee';
      try {
        const resp = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ secret: GATEWAY_SECRET, action: 'sheetsRead', sheetId: '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc', range: `${sheet}!A:Z` }),
        });
        if (!resp.ok) continue;
        const d = await resp.json();
        if (!d.data || d.data.length < 2) continue;

        const headers = d.data[0];
        const rows = d.data.slice(1);
        const nameIdx = headers.findIndex(h => h && (h.toString().toLowerCase().includes('company_name') || h.toString().toLowerCase().includes('full_name') || h.toString().toLowerCase().includes('name')));
        const emailIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('email'));

        for (const row of rows) {
          const name = (row[nameIdx] || row[emailIdx] || 'Unknown').toString();
          for (const field of expirationFields) {
            const idx = headers.findIndex(h => h && h.toString().toLowerCase().includes(field.headerMatch));
            if (idx === -1 || !row[idx]) continue;
            const expDate = new Date(row[idx]);
            if (isNaN(expDate.getTime())) continue;
            const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

            if (expDate < now) {
              alerts.critical.push({ name, type, item: field.label, date: expDate.toLocaleDateString(), daysLeft });
            } else if (expDate < sevenDays) {
              alerts.urgent.push({ name, type, item: field.label, date: expDate.toLocaleDateString(), daysLeft });
            } else if (expDate < thirtyDays) {
              alerts.warning.push({ name, type, item: field.label, date: expDate.toLocaleDateString(), daysLeft });
            }
          }
        }
      } catch (e) {
        console.error(`Error scanning ${sheet}:`, e);
      }
    }

    const totalAlerts = alerts.critical.length + alerts.urgent.length + alerts.warning.length;
    if (totalAlerts === 0) {
      return res.status(200).json({ sent: false, reason: 'No compliance alerts today', timestamp: now.toISOString() });
    }

    // Build email
    let body = `<p>Daily compliance scan found <strong>${totalAlerts} alert(s)</strong> as of ${now.toLocaleDateString()}:</p>`;
    const sections = [
      { key: 'critical', title: '🚨 EXPIRED', color: '#FF4444', bgColor: '#fee' },
      { key: 'urgent', title: '⚠️ Expiring Within 7 Days', color: '#FF9800', bgColor: '#fff8e1' },
      { key: 'warning', title: '📋 Expiring Within 30 Days', color: '#2196F3', bgColor: '#e3f2fd' },
    ];

    for (const sec of sections) {
      const items = alerts[sec.key];
      if (items.length === 0) continue;
      body += `<h3 style="color:${sec.color};margin-bottom:8px;">${sec.title} (${items.length})</h3>`;
      body += `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr style="background:${sec.bgColor};"><th style="text-align:left;padding:6px;border:1px solid #ddd;">Name</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Type</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Item</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Date</th></tr>`;
      for (const a of items) {
        const label = sec.key === 'critical' ? `${a.date} (${Math.abs(a.daysLeft)}d ago)` : `${a.date} (${a.daysLeft}d)`;
        body += `<tr><td style="padding:6px;border:1px solid #ddd;">${a.name}</td><td style="padding:6px;border:1px solid #ddd;">${a.type}</td><td style="padding:6px;border:1px solid #ddd;">${a.item}</td><td style="padding:6px;border:1px solid #ddd;color:${sec.color};font-weight:bold;">${label}</td></tr>`;
      }
      body += '</table>';
    }

    body += '<p style="font-size:13px;color:#666;">Log in to <a href="https://lytcomm.com/#admin-dashboard">lytcomm.com</a> for full details.</p>';

    const subject = `LYT Daily Compliance: ${alerts.critical.length} expired, ${alerts.urgent.length} urgent, ${alerts.warning.length} upcoming`;
    const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;"><div style="background:linear-gradient(135deg,#0077B6,#00b4d8);padding:24px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="color:#fff;margin:0;font-size:20px;">lyt Communications</h1><p style="color:#fff;margin:4px 0 0;font-size:12px;opacity:0.8;">BUILDING DIGITAL FUTURES</p></div><div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;"><h2 style="margin-top:0;color:#0077B6;">Daily Compliance Digest</h2>${body}</div><div style="background:#f8f9fa;padding:16px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #eee;border-top:none;"><p style="margin:0;font-size:12px;color:#999;">Automated notification from LYT Communications</p></div></div>`;

    // Send to admins
    let sentCount = 0;
    for (const admin of ADMIN_EMAILS) {
      try {
        await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ secret: GATEWAY_SECRET, action: 'sendEmail', params: { to: admin, subject, htmlBody: html } }),
        });
        sentCount++;
      } catch (e) {
        console.error(`Failed to send to ${admin}:`, e);
      }
    }

    return res.status(200).json({ sent: true, sentTo: sentCount, totalAlerts, critical: alerts.critical.length, urgent: alerts.urgent.length, warning: alerts.warning.length, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Cron digest error:', error);
    return res.status(500).json({ error: 'Digest failed', details: error.message });
  }
}

// v1.0.0
