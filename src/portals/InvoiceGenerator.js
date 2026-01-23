// InvoiceGenerator.js v1.0 - LYT Custom Invoice Generator
// Auto-generate invoices from approved work data
import React, { useState, useEffect } from 'react';
import { 
  Receipt, Download, Calendar, DollarSign, FileText, Building,
  Plus, Trash2, CheckCircle, AlertCircle, RefreshCw, Eye,
  Printer, Mail, Clock, MapPin, ChevronDown, Search, Filter
} from 'lucide-react';

const InvoiceGenerator = ({ darkMode, user }) => {
  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [selectedProject, setSelectedProject] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Mock projects
  const mockProjects = [
    { id: 'SLPH.01', name: 'Sulphur Area 1', lcpCode: 'LCP-2026-001', client: 'Metronet', clientAddress: '123 Corporate Dr, Evansville, IN 47708' },
    { id: 'SLPH.02', name: 'Sulphur Area 2', lcpCode: 'LCP-2026-002', client: 'Metronet', clientAddress: '123 Corporate Dr, Evansville, IN 47708' },
    { id: 'LAKE.01', name: 'Lake Charles Phase 1', lcpCode: 'LCP-2026-003', client: 'Metronet', clientAddress: '123 Corporate Dr, Evansville, IN 47708' },
  ];

  // Rate card items (from Google Sheet)
  const rateCard = {
    'HDD_BORE': { description: 'HDD Bore (per foot)', unit: 'ft', rate: 8.50 },
    'CONDUIT_2IN': { description: '2" Conduit Installation', unit: 'ft', rate: 2.25 },
    'CONDUIT_4IN': { description: '4" Conduit Installation', unit: 'ft', rate: 3.50 },
    'FIBER_PULL': { description: 'Fiber Cable Pull', unit: 'ft', rate: 1.75 },
    'SPLICE_CLOSURE': { description: 'Splice Closure Installation', unit: 'ea', rate: 450.00 },
    'HANDHOLE_SMALL': { description: 'Small Handhole Installation', unit: 'ea', rate: 275.00 },
    'HANDHOLE_LARGE': { description: 'Large Handhole Installation', unit: 'ea', rate: 450.00 },
    'POTHOLE': { description: 'Pothole/Daylighting', unit: 'ea', rate: 150.00 },
    'TRAFFIC_CONTROL': { description: 'Traffic Control Setup', unit: 'day', rate: 350.00 },
    'RESTORATION': { description: 'Restoration (per LF)', unit: 'ft', rate: 3.00 },
  };

  // Mock completed work items
  const getMockWorkItems = (projectId, startDate, endDate) => {
    if (!projectId) return [];
    return [
      { id: 1, date: '2026-01-20', section: '006', type: 'HDD_BORE', quantity: 450, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-20' },
      { id: 2, date: '2026-01-20', section: '006', type: 'CONDUIT_2IN', quantity: 450, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-20' },
      { id: 3, date: '2026-01-20', section: '006', type: 'POTHOLE', quantity: 4, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-20' },
      { id: 4, date: '2026-01-20', section: '006', type: 'TRAFFIC_CONTROL', quantity: 1, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-20' },
      { id: 5, date: '2026-01-21', section: '007', type: 'HDD_BORE', quantity: 380, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-21' },
      { id: 6, date: '2026-01-21', section: '007', type: 'CONDUIT_2IN', quantity: 380, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-21' },
      { id: 7, date: '2026-01-21', section: '007', type: 'POTHOLE', quantity: 3, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-21' },
      { id: 8, date: '2026-01-21', section: '007', type: 'TRAFFIC_CONTROL', quantity: 1, approved: true, approvedBy: 'Matt Roy', approvedAt: '2026-01-21' },
      { id: 9, date: '2026-01-22', section: '008', type: 'HDD_BORE', quantity: 290, approved: true, approvedBy: 'Donnie Wells', approvedAt: '2026-01-22' },
      { id: 10, date: '2026-01-22', section: '008', type: 'CONDUIT_2IN', quantity: 290, approved: true, approvedBy: 'Donnie Wells', approvedAt: '2026-01-22' },
      { id: 11, date: '2026-01-22', section: '008', type: 'POTHOLE', quantity: 2, approved: true, approvedBy: 'Donnie Wells', approvedAt: '2026-01-22' },
      { id: 12, date: '2026-01-23', section: '009', type: 'HDD_BORE', quantity: 520, approved: false },
    ];
  };

  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      setTimeout(() => {
        const items = getMockWorkItems(selectedProject, dateRange.start, dateRange.end);
        setWorkItems(items);
        // Generate invoice number
        const today = new Date();
        setInvoiceNumber(`INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${selectedProject.replace('.', '')}`);
        setLoading(false);
      }, 500);
    } else {
      setWorkItems([]);
    }
  }, [selectedProject, dateRange]);

  // Only approved items
  const approvedItems = workItems.filter(item => item.approved);

  // Calculate totals
  const calculateLineTotal = (item) => {
    const rate = rateCard[item.type]?.rate || 0;
    return item.quantity * rate;
  };

  const subtotal = approvedItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const taxRate = 0; // No tax for B2B
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Group items by type for summary
  const groupedItems = approvedItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = { ...rateCard[item.type], quantity: 0, total: 0 };
    }
    acc[item.type].quantity += item.quantity;
    acc[item.type].total += calculateLineTotal(item);
    return acc;
  }, {});

  // Generate PDF Invoice
  const generateInvoice = async () => {
    setGenerating(true);
    
    const project = mockProjects.find(p => p.id === selectedProject);
    
    // In production, this would generate a PDF using pdf-lib or similar
    // For now, create a downloadable text invoice
    const invoiceText = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                            LYT COMMUNICATIONS, LLC                           ║
║                         PROFESSIONAL FIBER OPTIC CONSTRUCTION                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Invoice #: ${invoiceNumber.padEnd(20)}  Date: ${new Date().toLocaleDateString().padEnd(15)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  BILL TO:                                                                    ║
║  ${(project?.client || 'Client').padEnd(74)} ║
║  ${(project?.clientAddress || '').padEnd(74)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PROJECT: ${(project?.name || '').padEnd(64)} ║
║  LCP CODE: ${(project?.lcpCode || '').padEnd(63)} ║
║  PERIOD: ${dateRange.start} to ${dateRange.end}${''.padEnd(38)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  DESCRIPTION                              QTY      RATE        AMOUNT        ║
╠══════════════════════════════════════════════════════════════════════════════╣
${Object.entries(groupedItems).map(([type, item]) => 
`║  ${item.description.padEnd(38)} ${String(item.quantity).padStart(6)} ${('$' + item.rate.toFixed(2)).padStart(10)} ${('$' + item.total.toFixed(2)).padStart(14)} ║`
).join('\n')}
╠══════════════════════════════════════════════════════════════════════════════╣
║                                            SUBTOTAL: ${('$' + subtotal.toFixed(2)).padStart(20)} ║
║                                                 TAX: ${('$' + tax.toFixed(2)).padStart(20)} ║
║                                               TOTAL: ${('$' + total.toFixed(2)).padStart(20)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PAYMENT TERMS: Net 30                                                       ║
║  Please remit payment to: LYT Communications, LLC                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${invoiceNumber}.txt`;
    link.click();

    setGenerating(false);
  };

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.95rem',
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Receipt size={28} color={accentPrimary} />
              Invoice Generator
            </h1>
            <p style={{ color: mutedColor }}>Generate invoices from approved work - LYT template format</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '24px',
        border: `1px solid ${borderColor}`
      }}>
        <h3 style={{ color: textColor, marginBottom: '16px', fontWeight: '600' }}>Select Work Period</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
            >
              <option value="">-- Select Project --</option>
              {mockProjects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button
              onClick={generateInvoice}
              disabled={!selectedProject || approvedItems.length === 0 || generating}
              style={{
                padding: '12px 24px',
                backgroundColor: (!selectedProject || approvedItems.length === 0) ? '#6b7280' : accentSecondary,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: (!selectedProject || approvedItems.length === 0) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? (
                <>
                  <RefreshCw size={18} className="spin" /> Generating...
                </>
              ) : (
                <>
                  <Download size={18} /> Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      {selectedProject && (
        <>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: '16px', 
            marginBottom: '24px' 
          }}>
            {[
              { label: 'Approved Items', value: approvedItems.length, icon: CheckCircle, color: '#10b981' },
              { label: 'Pending Items', value: workItems.filter(i => !i.approved).length, icon: Clock, color: '#f59e0b' },
              { label: 'Subtotal', value: '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), icon: DollarSign, color: accentPrimary },
              { label: 'Invoice Total', value: '$' + total.toLocaleString(undefined, { minimumFractionDigits: 2 }), icon: Receipt, color: accentSecondary },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: '12px',
                  padding: '20px',
                  border: `1px solid ${borderColor}`,
                  textAlign: 'center'
                }}
              >
                <stat.icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: textColor }}>{stat.value}</div>
                <div style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Invoice Preview Card */}
          <div style={{ 
            backgroundColor: cardBg, 
            borderRadius: '16px', 
            border: `1px solid ${borderColor}`,
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: darkMode ? '#111827' : '#f8fafc'
            }}>
              <div>
                <h3 style={{ color: textColor, fontWeight: '600', margin: 0 }}>
                  Invoice Preview
                </h3>
                <p style={{ color: mutedColor, fontSize: '0.85rem', margin: '4px 0 0' }}>
                  Invoice #: {invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}
              >
                <Eye size={16} /> {showPreview ? 'Hide' : 'Show'} Details
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
                <RefreshCw size={32} className="spin" style={{ marginBottom: '12px' }} />
                <p>Loading work data...</p>
              </div>
            ) : approvedItems.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
                <AlertCircle size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontWeight: '500' }}>No approved work items for this period</p>
                <p style={{ fontSize: '0.9rem' }}>Only approved work can be invoiced</p>
              </div>
            ) : (
              <div>
                {/* Grouped Line Items */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: darkMode ? '#111827' : '#f8fafc' }}>
                        {['Description', 'Quantity', 'Unit', 'Rate', 'Amount'].map(header => (
                          <th key={header} style={{ 
                            textAlign: header === 'Description' ? 'left' : 'right', 
                            padding: '12px 16px', 
                            fontWeight: '600', 
                            fontSize: '0.8rem', 
                            color: mutedColor,
                            textTransform: 'uppercase'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedItems).map(([type, item], idx) => (
                        <tr key={type} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '14px 16px', color: textColor }}>{item.description}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', color: textColor }}>{item.quantity.toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', color: mutedColor }}>{item.unit}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', color: textColor }}>${item.rate.toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: textColor }}>
                            ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${borderColor}` }}>
                        <td colSpan={4} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: textColor }}>
                          Subtotal:
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: textColor }}>
                          ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ padding: '10px 16px', textAlign: 'right', color: mutedColor }}>
                          Tax (0%):
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: mutedColor }}>
                          ${tax.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: darkMode ? '#111827' : '#f0f9ff' }}>
                        <td colSpan={4} style={{ padding: '16px', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem', color: textColor }}>
                          Total Due:
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', fontSize: '1.25rem', color: accentSecondary }}>
                          ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Detail Breakdown */}
                {showPreview && (
                  <div style={{ 
                    padding: '24px', 
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    borderTop: `1px solid ${borderColor}`
                  }}>
                    <h4 style={{ color: textColor, marginBottom: '16px', fontWeight: '600' }}>
                      📋 Detailed Work Items
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            {['Date', 'Section', 'Type', 'Qty', 'Amount', 'Approved By'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: mutedColor, borderBottom: `1px solid ${borderColor}` }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {approvedItems.map(item => (
                            <tr key={item.id}>
                              <td style={{ padding: '8px 12px', color: textColor }}>{item.date}</td>
                              <td style={{ padding: '8px 12px', color: textColor, fontWeight: '500' }}>{item.section}</td>
                              <td style={{ padding: '8px 12px', color: textColor }}>{rateCard[item.type]?.description}</td>
                              <td style={{ padding: '8px 12px', color: textColor }}>{item.quantity}</td>
                              <td style={{ padding: '8px 12px', color: textColor }}>${calculateLineTotal(item).toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', color: mutedColor }}>{item.approvedBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info */}
      {!selectedProject && (
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '16px', 
          padding: '60px 24px',
          border: `1px solid ${borderColor}`,
          textAlign: 'center'
        }}>
          <Receipt size={64} color={mutedColor} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: textColor, marginBottom: '8px' }}>Select a Project</h3>
          <p style={{ color: mutedColor }}>Choose a project and date range to generate invoices from approved work</p>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default InvoiceGenerator;
