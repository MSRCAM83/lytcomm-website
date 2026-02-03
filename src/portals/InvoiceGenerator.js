/**
 * LYT Communications - Invoice Generator
 * Version: 1.0.0
 * Created: 2026-02-03
 * 
 * Auto-generates invoices from QC-approved segments + rate cards.
 * Calculates line items based on footage, splice type, and Vexus rate card.
 * Supports per-contractor and per-section grouping.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, DollarSign, Download, Printer, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Filter, Calendar,
  // eslint-disable-next-line no-unused-vars
  Building2, Loader, RefreshCw, ArrowLeft
} from 'lucide-react';
import { loadFullProject, loadRateCards } from '../services/mapService';

// ===== RATE CARD DEFINITIONS (Vexus LA/TX 2026 fallback) =====
const DEFAULT_RATES = {
  UG1:  { desc: 'Directional bore 1-4 ducts (1.25" ID)', uom: 'LF', price: 8.00 },
  UG4:  { desc: 'Pull up to 144ct armored/micro cable', uom: 'LF', price: 0.55 },
  UG28: { desc: 'Place 288-432ct armored fiber in duct', uom: 'LF', price: 1.00 },
  FS1:  { desc: 'Fusion splice 1 fiber', uom: 'EA', price: 16.50 },
  FS2:  { desc: 'Ring cut (mid-span terminal)', uom: 'EA', price: 275.00 },
  FS3:  { desc: 'Test fiber (OTDR/power meter)', uom: 'EA', price: 6.60 },
  FS4:  { desc: 'ReEnter/Install Enclosure (end-of-line)', uom: 'EA', price: 137.50 },
  UG10: { desc: '30x48x30 fiberglass handhole', uom: 'EA', price: 310.00 },
  UG11: { desc: '24x36x24 fiberglass handhole', uom: 'EA', price: 110.00 },
  UG17: { desc: '17x30x18 HDPE handhole', uom: 'EA', price: 60.00 },
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

function InvoiceGenerator({ darkMode, user, setCurrentPage, loggedInUser, project }) {
  const currentUser = user || loggedInUser;
  const [segments, setSegments] = useState([]);
  const [splicePoints, setSplicePoints] = useState([]);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('all');
  const [filterContractor, setFilterContractor] = useState('all');
  const [showOnlyApproved, setShowOnlyApproved] = useState(true);
  const [expanded, setExpanded] = useState({});

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
        
        // Try to load rate cards from DB
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
  }, [project]);

  // Filter segments
  const filteredSegments = useMemo(() => {
    let segs = segments;
    if (showOnlyApproved) {
      segs = segs.filter(s => s.boring_status === 'QC Approved' || s.pulling_status === 'QC Approved');
    }
    if (filterSection !== 'all') segs = segs.filter(s => s.section === filterSection);
    if (filterContractor !== 'all') segs = segs.filter(s => s.boring_assigned_to === filterContractor || s.pulling_assigned_to === filterContractor);
    return segs;
  }, [segments, showOnlyApproved, filterSection, filterContractor]);

  // Calculate all line items
  const invoiceData = useMemo(() => {
    const lineItems = [];
    
    // Segment items (boring + pulling)
    filteredSegments.forEach(seg => {
      const items = calculateSegmentItems(seg);
      items.forEach(item => {
        lineItems.push({ ...item, source: seg.contractor_id || seg.segment_id, section: seg.section });
      });
    });
    
    // Splice items
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
    
    // Group by code
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

  // Get unique sections + contractors for filters
  const sections = useMemo(() => [...new Set(segments.map(s => s.section).filter(Boolean))].sort(), [segments]);
  const contractors = useMemo(() => [...new Set(segments.flatMap(s => [s.boring_assigned_to, s.pulling_assigned_to]).filter(Boolean))], [segments]);

  const toggleExpand = useCallback((code) => {
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));
  }, []);

  // Print / export
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-printable');
    if (!printContent) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Invoice - ${project?.project_name || 'LYT'}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f5f5f5;font-weight:600}.total{font-weight:700;font-size:1.1em}.right{text-align:right}h1{margin:0 0 4px}h3{color:#555;margin:0 0 20px}.logo{font-size:1.5em;font-weight:800;color:#0077B6}</style></head><body>`);
    w.document.write(printContent.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
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
              <div style={{ fontSize: '0.85rem', color: textMuted }}>{project?.project_name || 'Sulphur LA City Build'} • PO {project?.po_number || '3160880'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Printer size={16} /> Print
            </button>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: 4 }}>QC Approved</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: successGreen }}>{qcApprovedCount}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: textMuted }}>/{totalSegments}</span></div>
        </div>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: 4 }}>Line Items</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: accent }}>{invoiceData.summary.length}</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 10, padding: '12px 20px', border: `1px solid ${borderColor}`, flex: 1, minWidth: 140 }}>
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
      </div>

      {/* Invoice Table */}
      <div style={{ padding: '20px 24px' }}>
        {invoiceData.summary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
            <AlertTriangle size={32} color={textMuted} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>No billable items found</div>
            <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Segments must be QC Approved to appear on invoices.</div>
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
                        <td style={{ padding: '6px 12px', fontSize: '0.8rem', color: textMuted }}>{detail.source}</td>
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

      {/* Hidden printable invoice */}
      <div id="invoice-printable" style={{ display: 'none' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '1.5em', fontWeight: 800, color: '#0077B6' }}>lyt Communications</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>BUILDING DIGITAL FUTURES</div>
        </div>
        <h1 style={{ margin: '0 0 4px' }}>INVOICE</h1>
        <h3 style={{ color: '#555', margin: '0 0 20px' }}>{project?.project_name || 'Sulphur LA City Build'} • PO {project?.po_number || '3160880'}</h3>
        <div style={{ marginBottom: 16, fontSize: '0.9em' }}>
          <div><strong>Customer:</strong> {project?.customer || 'Vexus Fiber'}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          <div><strong>Segments:</strong> {filteredSegments.length} ({qcApprovedCount} QC Approved)</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', background: '#f5f5f5' }}>Code</th><th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', background: '#f5f5f5' }}>Description</th><th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', background: '#f5f5f5' }}>UOM</th><th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', background: '#f5f5f5' }}>Qty</th><th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', background: '#f5f5f5' }}>Rate</th><th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', background: '#f5f5f5' }}>Total</th></tr>
          </thead>
          <tbody>
            {invoiceData.summary.map(g => (
              <tr key={g.code}><td style={{ border: '1px solid #ddd', padding: '8px' }}>{g.code}</td><td style={{ border: '1px solid #ddd', padding: '8px' }}>{g.desc}</td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{g.uom}</td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{g.totalQty.toLocaleString()}</td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>${g.rate.toFixed(2)}</td><td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>${g.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: '1.1em' }}>GRAND TOTAL</td><td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: '1.1em' }}>${invoiceData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
          </tfoot>
        </table>
        <div style={{ marginTop: 30, fontSize: '0.8em', color: '#999' }}>Generated by LYT Communications Project Management System • {new Date().toISOString()}</div>
      </div>

      {/* Version */}
      <div style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 9, color: 'transparent', userSelect: 'none' }}>InvoiceGenerator v1.0.0</div>
    </div>
  );
}

export default InvoiceGenerator;
