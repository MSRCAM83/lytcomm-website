// notificationService.js v1.1.0 - Notification & Alert Service for LYT Communications
// Handles: expiring cert/COI alerts, push notifications, email triggers via Gateway, daily compliance digest

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbwiq8NzgdUQ6Hu44NHN3ASdAYTd68uK6wGRK_CpJroSoiMuv66aRmPAzDxmtXexl6MK/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';

// Notification types
export const NOTIFICATION_TYPES = {
  CERT_EXPIRING: 'cert_expiring',
  COI_EXPIRING: 'coi_expiring',
  LICENSE_EXPIRING: 'license_expiring',
  VEHICLE_INSURANCE_EXPIRING: 'vehicle_insurance_expiring',
  QC_APPROVAL_NEEDED: 'qc_approval_needed',
  ASSIGNMENT_NEW: 'assignment_new',
  ISSUE_REPORTED: 'issue_reported',
  ISSUE_RESOLVED: 'issue_resolved',
  STATUS_CHANGE: 'status_change',
  PHOTO_MISSING: 'photo_missing',
  POTHOLE_SUBMITTED: 'pothole_submitted',
  POTHOLE_APPROVED: 'pothole_approved',
  SEGMENT_COMPLETE: 'segment_complete',
};

// Severity levels
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  URGENT: 'urgent',
  CRITICAL: 'critical',
};

// ========== EXPIRATION CHECKING ==========

/**
 * Check all compliance items for upcoming expirations
 * Returns array of notification objects
 */
export async function checkExpirations(userEmail, userRole) {
  const notifications = [];
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // Fetch user's compliance data from onboarding sheet
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        sheetId: '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc',
        range: userRole === 'contractor' ? 'Contractor Submissions!A:Z' : 'Employee Submissions!A:Z',
      }),
    });

    if (!response.ok) return notifications;
    const data = await response.json();
    if (!data.data || data.data.length < 2) return notifications;

    const headers = data.data[0];
    const rows = data.data.slice(1);

    // Find rows matching this user
    const emailIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('email'));
    const userRows = rows.filter(r => r[emailIdx] && r[emailIdx].toString().toLowerCase() === userEmail.toLowerCase());

    if (userRows.length === 0) return notifications;
    const userRow = userRows[userRows.length - 1]; // Most recent submission

    // Check expiration fields
    const expirationFields = [
      { headerMatch: 'coi_expiration', type: NOTIFICATION_TYPES.COI_EXPIRING, label: 'Certificate of Insurance' },
      { headerMatch: 'license_expiration', type: NOTIFICATION_TYPES.LICENSE_EXPIRING, label: 'Business License' },
      { headerMatch: 'vehicle_insurance_exp', type: NOTIFICATION_TYPES.VEHICLE_INSURANCE_EXPIRING, label: 'Vehicle Insurance' },
      { headerMatch: 'cert_expiration', type: NOTIFICATION_TYPES.CERT_EXPIRING, label: 'Certification' },
      { headerMatch: 'osha_expiration', type: NOTIFICATION_TYPES.CERT_EXPIRING, label: 'OSHA Certification' },
      { headerMatch: 'flagger_cert_exp', type: NOTIFICATION_TYPES.CERT_EXPIRING, label: 'Flagger Certification' },
    ];

    for (const field of expirationFields) {
      const idx = headers.findIndex(h => h && h.toString().toLowerCase().includes(field.headerMatch));
      if (idx === -1 || !userRow[idx]) continue;

      const expDate = new Date(userRow[idx]);
      if (isNaN(expDate.getTime())) continue;

      if (expDate < now) {
        notifications.push({
          type: field.type,
          severity: SEVERITY.CRITICAL,
          title: `${field.label} EXPIRED`,
          message: `Your ${field.label} expired on ${expDate.toLocaleDateString()}. Please update immediately.`,
          expirationDate: expDate.toISOString(),
          daysUntilExpiry: Math.floor((expDate - now) / (1000 * 60 * 60 * 24)),
          createdAt: now.toISOString(),
        });
      } else if (expDate < sevenDays) {
        notifications.push({
          type: field.type,
          severity: SEVERITY.URGENT,
          title: `${field.label} expiring in ${Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))} days`,
          message: `Your ${field.label} expires on ${expDate.toLocaleDateString()}. Please renew soon.`,
          expirationDate: expDate.toISOString(),
          daysUntilExpiry: Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)),
          createdAt: now.toISOString(),
        });
      } else if (expDate < thirtyDays) {
        notifications.push({
          type: field.type,
          severity: SEVERITY.WARNING,
          title: `${field.label} expiring in ${Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))} days`,
          message: `Your ${field.label} expires on ${expDate.toLocaleDateString()}.`,
          expirationDate: expDate.toISOString(),
          daysUntilExpiry: Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)),
          createdAt: now.toISOString(),
        });
      }
    }
  } catch (err) {
    console.error('checkExpirations error:', err);
  }

  return notifications;
}

// ========== EMAIL NOTIFICATIONS ==========

/**
 * Send an email notification via Gateway
 */
export async function sendEmailNotification(toEmail, subject, htmlBody) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'gmailSend',
        to: toEmail,
        subject: `[LYT Communications] ${subject}`,
        htmlBody: wrapEmailTemplate(subject, htmlBody),
      }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (err) {
    console.error('sendEmailNotification error:', err);
    return false;
  }
}

/**
 * Send expiration alert emails to admins
 */
export async function sendExpirationAlertToAdmins(notifications, userName, userEmail) {
  if (!notifications || notifications.length === 0) return;

  const adminEmails = ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com'];
  const criticalItems = notifications.filter(n => n.severity === SEVERITY.CRITICAL || n.severity === SEVERITY.URGENT);

  if (criticalItems.length === 0) return;

  const itemsList = criticalItems.map(n =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${n.title}</td><td style="padding:8px;border-bottom:1px solid #eee;color:${n.severity === 'critical' ? '#dc3545' : '#ffc107'}">${n.severity.toUpperCase()}</td><td style="padding:8px;border-bottom:1px solid #eee;">${n.daysUntilExpiry < 0 ? 'EXPIRED' : n.daysUntilExpiry + ' days'}</td></tr>`
  ).join('');

  const body = `
    <p><strong>${userName}</strong> (${userEmail}) has compliance items requiring attention:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#f8f9fa;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:left;">Severity</th><th style="padding:8px;text-align:left;">Time Remaining</th></tr>
      ${itemsList}
    </table>
    <p>Please follow up with this team member to ensure compliance is maintained.</p>
  `;

  for (const admin of adminEmails) {
    await sendEmailNotification(admin, `Compliance Alert: ${userName}`, body);
  }
}

// ========== PROJECT MAP NOTIFICATIONS ==========

/**
 * Notify admins when QC approval is needed
 */
export async function notifyQCNeeded(segmentId, workType, submittedBy) {
  const subject = `QC Approval Needed: ${segmentId} (${workType})`;
  const body = `
    <p><strong>${submittedBy}</strong> has marked <strong>${workType}</strong> as complete for segment <strong>${segmentId}</strong>.</p>
    <p>Please review and approve/reject in the <a href="https://lytcomm.com/#project-map">Project Map</a>.</p>
  `;

  const adminEmails = ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com'];
  for (const admin of adminEmails) {
    await sendEmailNotification(admin, subject, body);
  }
}

/**
 * Notify contractor of new assignment
 */
export async function notifyNewAssignment(contractorEmail, projectName, segmentIds, workType) {
  const subject = `New Assignment: ${projectName}`;
  const body = `
    <p>You have been assigned new <strong>${workType}</strong> work on <strong>${projectName}</strong>.</p>
    <p><strong>Segments:</strong> ${segmentIds.join(', ')}</p>
    <p>View your assignments in the <a href="https://lytcomm.com/#project-map">Project Map</a>.</p>
  `;

  await sendEmailNotification(contractorEmail, subject, body);
}

/**
 * Notify contractor when work is approved or rejected
 */
export async function notifyQCResult(contractorEmail, segmentId, workType, approved, notes) {
  const subject = `QC ${approved ? 'Approved' : 'Rejected'}: ${segmentId} (${workType})`;
  const body = `
    <p>Your <strong>${workType}</strong> work on segment <strong>${segmentId}</strong> has been <strong style="color:${approved ? '#28a745' : '#dc3545'}">${approved ? 'APPROVED' : 'REJECTED'}</strong>.</p>
    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    ${!approved ? '<p>Please review the feedback and address any issues in the <a href="https://lytcomm.com/#project-map">Project Map</a>.</p>' : ''}
  `;

  await sendEmailNotification(contractorEmail, subject, body);
}

// ========== IN-APP NOTIFICATION STORAGE ==========

const NOTIFICATION_STORAGE_KEY = 'lyt_notifications';

/**
 * Get stored notifications for current user
 */
export function getStoredNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a notification to local storage
 */
export function addNotification(notification) {
  const notifications = getStoredNotifications();
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    read: false,
    ...notification,
    createdAt: notification.createdAt || new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  // Keep max 100 notifications
  if (notifications.length > 100) notifications.length = 100;
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  return newNotif;
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId) {
  const notifications = getStoredNotifications();
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  }
}

/**
 * Mark all as read
 */
export function markAllAsRead() {
  const notifications = getStoredNotifications();
  notifications.forEach(n => { n.read = true; });
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
}

/**
 * Get unread count
 */
export function getUnreadCount() {
  return getStoredNotifications().filter(n => !n.read).length;
}

/**
 * Clear all notifications
 */
export function clearNotifications() {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify([]));
}

// ========== PUSH NOTIFICATION SUPPORT ==========

/**
 * Request push notification permission
 */
export async function requestPushPermission() {
  if (!('Notification' in window)) {
    console.log('Browser does not support push notifications');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Show a browser push notification
 */
export function showPushNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(`LYT: ${title}`, {
      body,
      icon: '/lyt_logo_dark.png',
      badge: '/lyt_logo_dark.png',
      tag: options.tag || `lyt-${Date.now()}`,
      requireInteraction: options.urgent || false,
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.hash = options.url;
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

// ========== EMAIL TEMPLATE ==========

function wrapEmailTemplate(title, body) {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
      <div style="background:linear-gradient(135deg,#0077B6,#00b4d8);padding:24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">lyt Communications</h1>
        <p style="color:#fff;margin:4px 0 0;font-size:12px;opacity:0.8;">BUILDING DIGITAL FUTURES</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;">
        <h2 style="margin-top:0;color:#0077B6;">${title}</h2>
        ${body}
      </div>
      <div style="background:#f8f9fa;padding:16px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #eee;border-top:none;">
        <p style="margin:0;font-size:12px;color:#999;">This is an automated notification from LYT Communications</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;">Do not reply to this email</p>
      </div>
    </div>
  `;
}

// ========== DAILY COMPLIANCE DIGEST ==========

const ADMIN_EMAILS = ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com'];

/**
 * Generate and send a daily compliance digest email to all admins.
 * Scans all contractors and employees for expiring/expired items.
 * Call this from a scheduled trigger (e.g., Google Apps Script cron or Vercel cron).
 */
export async function sendDailyComplianceDigest() {
  try {
    const now = new Date();
    const alerts = { critical: [], urgent: [], warning: [] };

    // Fetch all contractor submissions
    const contractorResp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        sheetId: '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc',
        range: 'Contractor Submissions!A:Z',
      }),
    });

    // Fetch all employee submissions
    const employeeResp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        sheetId: '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc',
        range: 'Employee Submissions!A:Z',
      }),
    });

    const datasets = [];
    if (contractorResp.ok) {
      const d = await contractorResp.json();
      if (d.data && d.data.length > 1) datasets.push({ type: 'Contractor', data: d.data });
    }
    if (employeeResp.ok) {
      const d = await employeeResp.json();
      if (d.data && d.data.length > 1) datasets.push({ type: 'Employee', data: d.data });
    }

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

    for (const dataset of datasets) {
      const headers = dataset.data[0];
      const rows = dataset.data.slice(1);
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
            alerts.critical.push({ name, type: dataset.type, item: field.label, expired: expDate.toLocaleDateString(), daysLeft });
          } else if (expDate < sevenDays) {
            alerts.urgent.push({ name, type: dataset.type, item: field.label, expires: expDate.toLocaleDateString(), daysLeft });
          } else if (expDate < thirtyDays) {
            alerts.warning.push({ name, type: dataset.type, item: field.label, expires: expDate.toLocaleDateString(), daysLeft });
          }
        }
      }
    }

    const totalAlerts = alerts.critical.length + alerts.urgent.length + alerts.warning.length;
    if (totalAlerts === 0) return { sent: false, reason: 'No compliance alerts today' };

    // Build email body
    let body = `<p>Daily compliance scan found <strong>${totalAlerts} alert(s)</strong> as of ${now.toLocaleDateString()}:</p>`;

    if (alerts.critical.length > 0) {
      body += `<h3 style="color:#FF4444;margin-bottom:8px;">🚨 EXPIRED (${alerts.critical.length})</h3><table style="width:100%;border-collapse:collapse;margin-bottom:16px;">`;
      body += '<tr style="background:#fee;"><th style="text-align:left;padding:6px;border:1px solid #ddd;">Name</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Type</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Item</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Expired</th></tr>';
      for (const a of alerts.critical) {
        body += `<tr><td style="padding:6px;border:1px solid #ddd;">${a.name}</td><td style="padding:6px;border:1px solid #ddd;">${a.type}</td><td style="padding:6px;border:1px solid #ddd;">${a.item}</td><td style="padding:6px;border:1px solid #ddd;color:#FF4444;font-weight:bold;">${a.expired} (${Math.abs(a.daysLeft)}d ago)</td></tr>`;
      }
      body += '</table>';
    }

    if (alerts.urgent.length > 0) {
      body += `<h3 style="color:#FF9800;margin-bottom:8px;">⚠️ Expiring Within 7 Days (${alerts.urgent.length})</h3><table style="width:100%;border-collapse:collapse;margin-bottom:16px;">`;
      body += '<tr style="background:#fff8e1;"><th style="text-align:left;padding:6px;border:1px solid #ddd;">Name</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Type</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Item</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Expires</th></tr>';
      for (const a of alerts.urgent) {
        body += `<tr><td style="padding:6px;border:1px solid #ddd;">${a.name}</td><td style="padding:6px;border:1px solid #ddd;">${a.type}</td><td style="padding:6px;border:1px solid #ddd;">${a.item}</td><td style="padding:6px;border:1px solid #ddd;color:#FF9800;font-weight:bold;">${a.expires} (${a.daysLeft}d)</td></tr>`;
      }
      body += '</table>';
    }

    if (alerts.warning.length > 0) {
      body += `<h3 style="color:#2196F3;margin-bottom:8px;">📋 Expiring Within 30 Days (${alerts.warning.length})</h3><table style="width:100%;border-collapse:collapse;margin-bottom:16px;">`;
      body += '<tr style="background:#e3f2fd;"><th style="text-align:left;padding:6px;border:1px solid #ddd;">Name</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Type</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Item</th><th style="text-align:left;padding:6px;border:1px solid #ddd;">Expires</th></tr>';
      for (const a of alerts.warning) {
        body += `<tr><td style="padding:6px;border:1px solid #ddd;">${a.name}</td><td style="padding:6px;border:1px solid #ddd;">${a.type}</td><td style="padding:6px;border:1px solid #ddd;">${a.item}</td><td style="padding:6px;border:1px solid #ddd;">${a.expires} (${a.daysLeft}d)</td></tr>`;
      }
      body += '</table>';
    }

    body += '<p style="font-size:13px;color:#666;">Log in to <a href="https://lytcomm.com/#admin-dashboard">lytcomm.com</a> for full details.</p>';

    const subject = `LYT Daily Compliance Digest: ${alerts.critical.length} expired, ${alerts.urgent.length} urgent, ${alerts.warning.length} upcoming`;
    const html = wrapEmailTemplate('Daily Compliance Digest', body);

    // Send to all admins
    let sentCount = 0;
    for (const admin of ADMIN_EMAILS) {
      try {
        await sendEmailNotification(admin, subject, html);
        sentCount++;
      } catch (e) {
        console.error(`Failed to send digest to ${admin}:`, e);
      }
    }

    return { sent: true, sentTo: sentCount, totalAlerts, critical: alerts.critical.length, urgent: alerts.urgent.length, warning: alerts.warning.length };
  } catch (err) {
    console.error('sendDailyComplianceDigest error:', err);
    return { sent: false, error: err.message };
  }
}

// v1.1.0
