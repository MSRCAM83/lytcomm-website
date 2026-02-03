/**
 * LYT Communications - Invoice Generator
 * Version: 2.0.0
 * Created: 2026-02-03
 * Updated: 2026-02-03
 * 
 * Auto-generates invoices from QC-approved segments + rate cards.
 * Features: invoice numbering, CSV export, date range filter,
 * invoice history, professional print layout, copy-to-clipboard.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
// eslint-disable-next-line no-unused-vars
  FileText, DollarSign, Download, Printer, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Filter, Calendar,
  // eslint-disable-next-line no-unused-vars
  Building2, Loader, RefreshCw, ArrowLeft, Copy, Hash, Clock, Trash2, Eye
} from 'lucide-react';
import { loadFullProject, loadRateCards } from '../services/mapService';

// ===== RATE CARD DEFINITIONS (Vexus LA/TX 2026 fallback) =====
const DEFAULT_RATES = {
  UG1:  { desc: 'Directional bore 1-4 ducts (1.25" ID)', uom: 'LF', price: 8.00 },
  UG23: { desc: 'Directional bore 5 ducts (1.25" ID)', uom: 'LF', price: 9.50 },
  UG24: { desc: 'Directional bore 6 ducts (1.25" ID)', uom: 'LF', price: 10.50 },
  UG4:  { desc: 'Pull up to 144ct armored/micro cable', uom: 'LF', price: 0.55 },
  UG28: { desc: 'Place 288-432ct armored fiber in duct', uom: 'LF', price: 1.00 },
  FS1:  { desc: 'Fusion splice 1 fiber', uom: 'EA', price: 16.50 },
  FS2:  { desc: 'Ring cut (mid-span terminal)', uom: 'EA', price: 275.00 },
  FS3:  { desc: 'Test fiber (OTDR/power meter)', uom: 'EA', price: 6.60 },
  FS4:  { desc: 'ReEnter/Install Enclosure (end-of-line)', uom: 'EA', price: 137.50 },
  UG10: { desc: '30x48x30 fiberglass handhole', uom: 'EA', price: 310.00 },
  UG11: { desc: '24x36x24 fiberglass handhole', uom: 'EA', price: 110.00 },
  UG12: { desc: 'Utility Box', uom: 'EA', price: 20.00 },
  UG13: { desc: 'Ground rod 5/8" x 8\'', uom: 'EA', price: 40.00 },
  UG17: { desc: '17x30x18 HDPE handhole', uom: 'EA', price: 60.00 },
  UG18: { desc: '24x36x18 HDPE handhole', uom: 'EA', price: 125.00 },
  UG19: { desc: '30x48x18 HDPE handhole', uom: 'EA', price: 250.00 },
  UG20: { desc: 'Terminal Box', uom: 'EA', price: 40.00 },
  UG27: { desc: '30x48x24 HDPE handhole', uom: 'EA', price: 210.00 },
};

// Splice billing rules
function calculateSpliceItems(spliceType, positionType, fiberCount) {
  const items = [];
  
  if (spliceType === '1x4') {
    if (positionType === 'mid-span') {
      items.push({ code: 'FS2', desc: 'Ring cut', qty: 1, rate: 275.00 });
    } else {
      items.push({ code: 'FS4', desc: 'Case setup (end-of-line)', qty: 1, rate: 137.50 });
    }
    items.push({ code: 'FS1', desc: 'Fusion splice', qty: 2, rate: 16.50 });
    items.push({ code: 'FS3', desc: 'Power meter test', qty: 8, rate: 6.60 });
  } else if (spliceType === '1x8') {
    if (positionType === 'mid-span') {
      items.push({ code: 'FS2', desc: 'Ring cut', qty: 1, rate: 275.00 });
    } else {
      items.push({ code: 'FS4', desc: 'Case setup (end-of-line)', qty: 1, rate: 137.50 });
    }
    items.push({ code: 'FS1', desc: 'Fusion splice', qty: 8, rate: 16.50 });
    items.push({ code: 'FS3', desc: 'Power meter test', qty: 16, rate: 6.60 });
  } else if (spliceType === 'F1' || spliceType === 'TYCO-D') {
    items.push({ code: 'FS4', desc: 'Case setup', qty: 1, rate: 137.50 });
    items.push({ code: 'FS1', desc: 'Fusion splice', qty: fiberCount || 432, rate: 16.50 });
  }
  
  return items.map(i => ({ ...i, total: i.qty * i.rate }));
}

function calculateSegmentItems(segment) {
  const items = [];
  const footage = Number(segment.footage) || 0;
  const actualFootage = Number(segment.boring_actual_footage) || footage;
  
  // Boring
  if (segment.boring_status === 'QC Approved') {
    items.push({ code: 'UG1', desc: 'Directional bore 1-4 ducts', qty: actualFootage, uom: 'LF', rate: 8.00, total: actualFootage * 8.00 });
  }
  
  // Pulling
  if (segment.pulling_status === 'QC Approved') {
    const cableType = segment.pulling_cable_type || '24F';
    const ct = parseInt(cableType);
    if (ct > 144) {
      items.push({ code: 'UG28', desc: `Place ${cableType} armored fiber`, qty: footage, uom: 'LF', rate: 1.00, total: footage * 1.00 });
    } else {
      items.push({ code: 'UG4', desc: `Pull ${cableType} cable`, qty: footage, uom: 'LF', rate: 0.55, total: footage * 0.55 });
    }
  }
  
  return items;
}

// Generate invoice number
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const saved = JSON.parse(localStorage.getItem('lyt_invoice_counter') || '{}');
  const counter = (saved[year] || 0) + 1;
  saved[year] = counter;
  localStorage.setItem('lyt_invoice_counter', JSON.stringify(saved));
  return `LYT-INV-${year}-${String(counter).padStart(4, '0')}`;
}

// Format date for display
function fmtDate(d) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function InvoiceGenerator({ darkMode, user, setCurrentPage, loggedInUser, project }) {
  const currentUser = user || loggedInUser;
  const [segments, setSegments] = useState([]);
  const [splicePoints, setSplicePoints] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('all');
  const [filterContractor, setFilterContractor] = useState('all');
  const [showOnlyApproved, setShowOnlyApproved] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [copyMsg, setCopyMsg] = useState('');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const successGreen = '#28a745';
  const bg = darkMode ? '#0d1b2a' : '#ffffff';

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const projectId = project?.project_id || 'VXS-SLPH01-006';
        const data = await loadFullProject(projectId);
        setSegments(data.segments || []);
        setSplicePoints(data.splicePoints || []);
        
        const rateData = await loadRateCards('vexus-la-tx-2026');
        if (rateData && rateData.length > 0) {
          const rateMap = {};
          rateData.forEach(r => {
            rateMap[r.unit_code] = { desc: r.description, uom: r.uom, price: parseFloat(r.unit_price) };
          });
          setRates(prev => ({ ...prev, ...rateMap }));
        }
      } catch (err) {
        console.error('[Invoice] Load failed:', err);
      }
      setLoading(false);
    }
    load();
    // Load invoice history
    try {
      const saved = JSON.parse(localStorage.getItem('lyt_invoice_history') || '[]');
      setHistory(saved);
    } catch (e) { /* ignore */ }
  }, [project]);

  // Filter segments
  const filteredSegments = useMemo(() => {
    let segs = segments;
    if (showOnlyApproved) {
      segs = segs.filter(s => s.boring_status === 'QC Approved' || s.pulling_status === 'QC Approved');
    }
    if (filterSection !== 'all') segs = segs.filter(s => s.section === filterSection);
    if (filterContractor !== 'all') segs = segs.filter(s => s.boring_assigned_to === filterContractor || s.pulling_assigned_to === filterContractor);
    // Date range filter (based on QC approval date)
    if (dateFrom) {
      const from = new Date(dateFrom);
      segs = segs.filter(s => {
        const d = new Date(s.boring_qc_approved_date || s.pulling_qc_approved_date || s.boring_completed || '2000-01-01');
        return d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      segs = segs.filter(s => {
        const d = new Date(s.boring_qc_approved_date || s.pulling_qc_approved_date || s.boring_completed || '2099-12-31');
        return d <= to;
      });
    }
    return segs;
  }, [segments, showOnlyApproved, filterSection, filterContractor, dateFrom, dateTo]);

  // Calculate all line items
  const invoiceData = useMemo(() => {
    const lineItems = [];
    
    filteredSegments.forEach(seg => {
      const items = calculateSegmentItems(seg);
      items.forEach(item => {
        lineItems.push({ ...item, source: seg.contractor_id || seg.segment_id, section: seg.section });
      });
    });
    
    const filteredSplices = showOnlyApproved
      ? splicePoints.filter(sp => sp.status === 'QC Approved')
      : splicePoints;
    
    filteredSplices.forEach(sp => {
      if (filterSection !== 'all' && !sp.splice_id?.includes(`-${filterSection}`)) return;
      const items = calculateSpliceItems(sp.splice_type, sp.position_type, parseInt(sp.fiber_count) || 2);
      items.forEach(item => {
        lineItems.push({ ...item, uom: item.uom || 'EA', source: sp.contractor_id || sp.splice_id, section: sp.splice_id?.split('-')[4] || '?' });
      });
    });
    
    const grouped = {};
    lineItems.forEach(item => {
      const key = item.code;
      if (!grouped[key]) grouped[key] = { code: item.code, desc: item.desc, uom: item.uom || 'EA', rate: item.rate, totalQty: 0, totalValue: 0, details: [] };
      grouped[key].totalQty += item.qty;
      grouped[key].totalValue += item.total;
      grouped[key].details.push(item);
    });
    
    const summary = Object.values(grouped).sort((a, b) => a.code.localeCompare(b.code));
    const grandTotal = summary.reduce((sum, g) => sum + g.totalValue, 0);
    
    return { lineItems, summary, grandTotal };
  }, [filteredSegments, splicePoints, showOnlyApproved, filterSection]);

  const sections = useMemo(() => [...new Set(segments.map(s => s.section).filter(Boolean))].sort(), [segments]);
  const contractors = useMemo(() => [...new Set(segments.flatMap(s => [s.boring_assigned_to, s.pulling_assigned_to]).filter(Boolean))], [segments]);

  const toggleExpand = useCallback((code) => {
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));
  }, []);

  // ===== EXPORT: CSV Download =====
  const handleExportCSV = () => {
    const rows = [['Code', 'Description', 'UOM', 'Qty', 'Rate', 'Total']];
    invoiceData.summary.forEach(g => {
      rows.push([g.code, `"${g.desc}"`, g.uom, g.totalQty, g.rate.toFixed(2), g.totalValue.toFixed(2)]);
    });
    rows.push([]);
    rows.push(['', '', '', '', 'GRAND TOTAL', invoiceData.grandTotal.toFixed(2)]);
    
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${project?.project_name?.replace(/\s+/g, '_') || 'LYT'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== COPY TABLE TO CLIPBOARD =====
  const handleCopyTable = async () => {
    const lines = ['Code\tDescription\tUOM\tQty\tRate\tTotal'];
    invoiceData.summary.forEach(g => {
      lines.push(`${g.code}\t${g.desc}\t${g.uom}\t${g.totalQty}\t$${g.rate.toFixed(2)}\t$${g.totalValue.toFixed(2)}`);
    });
    lines.push(`\t\t\t\tGRAND TOTAL\t$${invoiceData.grandTotal.toFixed(2)}`);
    
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyMsg('Copied to clipboard!');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch (e) {
      setCopyMsg('Copy failed');
      setTimeout(() => setCopyMsg(''), 2000);
    }
  };

  // ===== GENERATE INVOICE NUMBER & SAVE =====
  const handleGenerateInvoice = () => {
    const num = generateInvoiceNumber();
    setInvoiceNumber(num);
    
    // Save to history
    const record = {
      invoiceNumber: num,
      date: new Date().toISOString(),
      project: project?.project_name || 'Sulphur LA City Build',
      customer: project?.customer || 'Vexus Fiber',
      poNumber: project?.po_number || '3160880',
      total: invoiceData.grandTotal,
      lineItemCount: invoiceData.summary.length,
      segmentCount: filteredSegments.length,
      section: filterSection,
      contractor: filterContractor,
    };
    
    const updatedHistory = [record, ...history].slice(0, 50);
    setHistory(updatedHistory);
    try {
      localStorage.setItem('lyt_invoice_history', JSON.stringify(updatedHistory));
    } catch (e) { /* ignore */ }
  };

  const handleDeleteHistory = (idx) => {
    const updated = history.filter((_, i) => i !== idx);
    setHistory(updated);
    localStorage.setItem('lyt_invoice_history', JSON.stringify(updated));
  };

  // ===== PRINT =====
  const handlePrint = () => {
    if (!invoiceNumber) handleGenerateInvoice();
    const invNum = invoiceNumber || 'DRAFT';
    const now = new Date();
    
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Invoice ${invNum}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .logo { font-size: 1.8em; font-weight: 800; }
        .logo span:first-child { color: #0a3a7d; }
        .logo span:nth-child(2) { color: #2ec7c0; }
        .invoice-title { font-size: 2em; font-weight: 800; color: #0077B6; margin: 0; }
        .meta { font-size: 0.9em; line-height: 1.8; }
        .meta strong { display: inline-block; width: 100px; }
        .divider { border-top: 2px solid #0077B6; margin: 20px 0; }
        .total-row td { font-weight: 700; font-size: 1.1em; background: #f8fafc; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.8em; color: #999; }
        .terms { margin-top: 30px; font-size: 0.85em; color: #666; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>`);

    w.document.write(`
      <div class="header">
        <div>
          <div class="logo"><span>ly</span><span>t</span> <span style="font-size:0.5em;color:#666;font-weight:400;">Communications</span></div>
          <div style="font-size:0.75em;color:#999;margin-top:2px;">BUILDING DIGITAL FUTURES</div>
          <div style="margin-top:12px;font-size:0.85em;color:#555;">
            12130 State Highway 3<br>
            Webster, TX 77598<br>
            (832) 850-3887<br>
            info@lytcomm.com
          </div>
        </div>
        <div style="text-align:right;">
          <div class="invoice-title">INVOICE</div>
          <div class="meta" style="margin-top:12px;">
            <strong>Invoice #:</strong> ${invNum}<br>
            <strong>Date:</strong> ${now.toLocaleDateString()}<br>
            <strong>PO #:</strong> ${project?.po_number || '3160880'}<br>
            <strong>Terms:</strong> Net 30
          </div>
        </div>
      </div>
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
        <div class="meta">
          <strong>Bill To:</strong><br>
          ${project?.customer || 'Vexus Fiber'}<br>
          ${project?.project_name || 'Sulphur LA City Build'}
        </div>
        <div class="meta" style="text-align:right;">
          <strong>Project:</strong> ${project?.project_id || 'VXS-SLPH01-006'}<br>
          <strong>Segments:</strong> ${filteredSegments.length} (${segments.filter(s => s.boring_status === 'QC Approved').length} QC Approved)
          ${filterSection !== 'all' ? `<br><strong>Section:</strong> ${filterSection}` : ''}
          ${filterContractor !== 'all' ? `<br><strong>Contractor:</strong> ${filterContractor}` : ''}
        </div>
      </div>
    `);

    w.document.write(`<table>
      <thead><tr>
        <th>Code</th><th>Description</th><th>UOM</th>
        <th class="right">Qty</th><th class="right">Rate</th><th class="right">Total</th>
      </tr></thead><tbody>`);
    
    invoiceData.summary.forEach(g => {
      w.document.write(`<tr>
        <td><strong>${g.code}</strong></td><td>${g.desc}</td><td style="text-align:center;">${g.uom}</td>
        <td class="right">${g.totalQty.toLocaleString()}</td>
        <td class="right">$${g.rate.toFixed(2)}</td>
        <td class="right">$${g.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>`);
    });

    w.document.write(`</tbody><tfoot>
      <tr class="total-row">
        <td colspan="5" class="right" style="font-size:1.1em;">GRAND TOTAL</td>
        <td class="right" style="font-size:1.1em;color:#28a745;">$${invoiceData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr></tfoot></table>`);

    w.document.write(`
      <div class="terms">
        <strong>Terms & Conditions:</strong><br>
        Payment due within 30 days of invoice date. Late payments subject to 1.5% monthly interest.
        All work performed per signed Master Subcontractor Agreement. Unit prices per approved rate card.
      </div>
      <div class="footer">
        Generated by LYT Communications Project Management System<br>
        Invoice ${invNum} • ${now.toISOString()}
      </div>
    </body></html>`);

    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: textMuted }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12 }}>Loading invoice data...</span>
      </div>
    );
  }

  const qcApprovedCount = segments.filter(s => s.boring_status === 'QC Approved').length;
  const totalSegments = segments.length;

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderColor}`, background: cardBg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {setCurrentPage && (
              <button onClick={() => setCurrentPage(isAdmin ? 'admin-dashboard' : 'contractor-dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4, display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <FileText size={24} color={accent} />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: text }}>Invoice Generator</div>
              <div style={{ fontSize: '0.85rem', color: textMuted }}>
                {project?.project_name || 'Sulphur LA City Build'} • PO {project?.po_number || '3160880'}
                {invoiceNumber && <span style={{ marginLeft: 8, color: accent, fontWeight: 600 }}>#{invoiceNumber}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!invoiceNumber ? (
              <button onClick={handleGenerateInvoice} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                <Hash size={16} /> Generate Invoice #
              </button>
            ) : (
              <div style={{ padding: '8px 14px', borderRadius: 8, background: `${successGreen}20`, color: successGreen, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> {invoiceNumber}
              </div>
            )}
            <button onClick={handleCopyTable} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Copy size={16} /> {copyMsg || 'Copy'}
            </button>
            <button onClick={handleExportCSV} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Download size={16} /> CSV
            </button>
            <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Printer size={16} /> Print
            </button>
            <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${showHistory ? accent : borderColor}`, background: showHistory ? `${accent}15` : 'transparent', color: showHistory ? accent : text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Clock size={16} /> History
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History Panel */}
      {showHistory && (
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${borderColor}`, background: darkMode ? '#0a1628' : '#f1f5f9' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: text, marginBottom: 12 }}>Recent Invoices ({history.length})</div>
          {history.length === 0 ? (
            <div style={{ color: textMuted, fontSize: '0.85rem' }}>No invoices generated yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {history.map((inv, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: cardBg, borderRadius: 8, border: `1px solid ${borderColor}`, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: accent }}>{inv.invoiceNumber}</span>
                    <span style={{ color: textMuted }}>{fmtDate(inv.date)}</span>
                    <span style={{ color: text }}>{inv.project}</span>
                    {inv.section !== 'all' && <span style={{ color: textMuted }}>Section {inv.section}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: successGreen }}>${inv.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                    <button onClick={() => handleDeleteHistory(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: 4 }}>QC Approved</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: successGreen }}>{qcApprovedCount}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: textMuted }}>/{totalSegments}</span></div>
        </div>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: 4 }}>Line Items</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: accent }}>{invoiceData.summary.length}</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: 4 }}>Filtered Segments</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: text }}>{filteredSegments.length}</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: 4 }}>Invoice Total</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: successGreen }}>${invoiceData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '12px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${borderColor}` }}>
        <Filter size={16} color={textMuted} />
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.85rem' }}>
          <option value="all">All Sections</option>
          {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filterContractor} onChange={e => setFilterContractor(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.85rem' }}>
          <option value="all">All Contractors</option>
          {contractors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: text, cursor: 'pointer' }}>
          <input type="checkbox" checked={showOnlyApproved} onChange={e => setShowOnlyApproved(e.target.checked)} />
          QC Approved Only
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <Calendar size={14} color={textMuted} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.82rem' }} />
          <span style={{ color: textMuted, fontSize: '0.85rem' }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.82rem' }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Clear</button>
          )}
        </div>
      </div>

      {/* Invoice Table */}
      <div style={{ padding: '20px 24px' }}>
        {invoiceData.summary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
            <AlertTriangle size={32} color={textMuted} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>No billable items found</div>
            <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Segments must be QC Approved to appear on invoices. Try adjusting filters or date range.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${accent}` }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: text, fontWeight: 700, width: 60 }}>Code</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: text, fontWeight: 700 }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: text, fontWeight: 700, width: 50 }}>UOM</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: text, fontWeight: 700, width: 80 }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: text, fontWeight: 700, width: 80 }}>Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: text, fontWeight: 700, width: 100 }}>Total</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.summary.map(group => (
                  <React.Fragment key={group.code}>
                    <tr onClick={() => toggleExpand(group.code)} style={{ borderBottom: `1px solid ${borderColor}`, cursor: 'pointer', background: expanded[group.code] ? (darkMode ? '#162b4d' : '#f1f5f9') : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: accent, fontWeight: 700 }}>{group.code}</td>
                      <td style={{ padding: '10px 12px', color: text }}>{group.desc}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: textMuted }}>{group.uom}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: text, fontWeight: 600 }}>{group.totalQty.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: textMuted }}>${group.rate.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: text, fontWeight: 700 }}>${group.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: textMuted }}>
                        {expanded[group.code] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {expanded[group.code] && group.details.map((detail, idx) => (
                      <tr key={`${group.code}-${idx}`} style={{ borderBottom: `1px solid ${borderColor}`, background: darkMode ? '#0a1628' : '#fafbfc' }}>
                        <td style={{ padding: '6px 12px 6px 28px', fontSize: '0.8rem', color: textMuted }}></td>
                        <td style={{ padding: '6px 12px', fontSize: '0.8rem', color: textMuted }}>{detail.source} {detail.section ? `(Sec ${detail.section})` : ''}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: '0.8rem', color: textMuted }}>{detail.uom || group.uom}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '0.8rem', color: textMuted }}>{detail.qty.toLocaleString()}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '0.8rem', color: textMuted }}>${detail.rate.toFixed(2)}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '0.8rem', color: textMuted }}>${detail.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `3px solid ${accent}` }}>
                  <td colSpan={5} style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: text }}>GRAND TOTAL</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: successGreen }}>${invoiceData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Version */}
      <div onClick={(e) => { if (e.detail === 3) alert('InvoiceGenerator v2.0.0'); }} style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 9, color: 'transparent', userSelect: 'none', cursor: 'default' }}>InvoiceGenerator v2.0.0</div>
    </div>
  );
}

export default InvoiceGenerator;
