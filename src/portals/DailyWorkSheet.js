// DailyWorkSheet.js v1.0 - Auto Daily Work Sheet Generator (Metronet Format)
// Generates Excel files matching exact Metronet template
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, Calendar, MapPin, Clock, User, Truck,
  Plus, Trash2, ChevronDown, CheckCircle, AlertCircle, RefreshCw,
  Building, Phone, Settings, Eye, Filter, Search
} from 'lucide-react';

const DailyWorkSheet = ({ darkMode, user }) => {
  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProject, setSelectedProject] = useState('');
  const [workEntries, setWorkEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [contractors, setContractors] = useState([]);

  // Mock data - would come from WorkMap/Production logs
  const mockProjects = [
    { id: 'SLPH.01', name: 'Sulphur Area 1', lcpCode: 'LCP-2026-001', client: 'Metronet' },
    { id: 'SLPH.02', name: 'Sulphur Area 2', lcpCode: 'LCP-2026-002', client: 'Metronet' },
    { id: 'LAKE.01', name: 'Lake Charles Phase 1', lcpCode: 'LCP-2026-003', client: 'Metronet' },
  ];

  const mockContractors = [
    { id: 1, company: 'Gulf Coast Boring LLC', contact: 'Mike Torres', phone: '(337) 555-0101', drills: ['Drill #1', 'Drill #2'] },
    { id: 2, company: 'XYZ Drilling', contact: 'James Wilson', phone: '(337) 555-0102', drills: ['Drill #3'] },
    { id: 3, company: 'ABC Underground', contact: 'Robert Lee', phone: '(337) 555-0103', drills: ['Drill #4', 'Drill #5'] },
  ];

  // Mock work entries from GPS/production data
  const getMockWorkEntries = (projectId, date) => {
    if (!projectId) return [];
    return [
      {
        id: 1,
        contractor: mockContractors[0],
        drill: 'Drill #1',
        section: '006',
        sectionType: 'UG',
        startTime: '07:00',
        endTime: '15:30',
        footage: 450,
        location: '1234 Main St, Sulphur, LA',
        crossStreets: 'Main St & Oak Ave',
        gpsCoords: '30.2366° N, 93.3774° W',
        trafficControl: true,
        purpose: 'Bore and place 2" conduit',
        notes: 'Clean bore, no issues',
        locateTicket: '811-2026-001234',
        locateExpiry: '2026-01-28',
      },
      {
        id: 2,
        contractor: mockContractors[0],
        drill: 'Drill #2',
        section: '007',
        sectionType: 'UG',
        startTime: '07:30',
        endTime: '16:00',
        footage: 380,
        location: '5678 Oak Ave, Sulphur, LA',
        crossStreets: 'Oak Ave & Pine St',
        gpsCoords: '30.2380° N, 93.3790° W',
        trafficControl: true,
        purpose: 'Bore and place 2" conduit',
        notes: 'Hit rock at 320ft, had to adjust depth',
        locateTicket: '811-2026-001235',
        locateExpiry: '2026-01-28',
      },
      {
        id: 3,
        contractor: mockContractors[1],
        drill: 'Drill #3',
        section: '008',
        sectionType: 'UG',
        startTime: '08:00',
        endTime: '14:30',
        footage: 290,
        location: '9012 Pine St, Sulphur, LA',
        crossStreets: 'Pine St & Elm Rd',
        gpsCoords: '30.2395° N, 93.3805° W',
        trafficControl: false,
        purpose: 'Bore and place 2" conduit - residential area',
        notes: 'Completed ahead of schedule',
        locateTicket: '811-2026-001236',
        locateExpiry: '2026-01-29',
      },
    ];
  };

  useEffect(() => {
    if (selectedProject && selectedDate) {
      setLoading(true);
      // Simulate API call to fetch work data
      setTimeout(() => {
        setWorkEntries(getMockWorkEntries(selectedProject, selectedDate));
        setLoading(false);
      }, 500);
    } else {
      setWorkEntries([]);
    }
  }, [selectedProject, selectedDate]);

  // Generate Excel file (using xlsx library pattern)
  const generateExcel = async () => {
    setGenerating(true);
    
    const project = mockProjects.find(p => p.id === selectedProject);
    
    // Build worksheet data matching Metronet format
    const worksheetData = [
      // Header rows
      ['DAILY WORK SHEET - METRONET'],
      [''],
      ['PROJECT:', project?.name || '', '', 'DATE:', selectedDate],
      ['LCP CODE:', project?.lcpCode || '', '', 'CLIENT:', project?.client || 'Metronet'],
      [''],
      // Column headers
      ['CONTRACTOR', 'CONTACT', 'PHONE', 'DRILL', 'SECTION', 'TYPE', 'START', 'END', 'FOOTAGE', 'LOCATION', 'CROSS STREETS', 'TRAFFIC CTRL', 'PURPOSE/REASON', '811 TICKET', 'NOTES'],
    ];

    // Add data rows
    workEntries.forEach(entry => {
      worksheetData.push([
        entry.contractor.company,
        entry.contractor.contact,
        entry.contractor.phone,
        entry.drill,
        entry.section,
        entry.sectionType,
        entry.startTime,
        entry.endTime,
        entry.footage,
        entry.location,
        entry.crossStreets,
        entry.trafficControl ? 'YES' : 'NO',
        entry.purpose,
        entry.locateTicket,
        entry.notes,
      ]);
    });

    // Add summary row
    const totalFootage = workEntries.reduce((sum, e) => sum + e.footage, 0);
    worksheetData.push(['']);
    worksheetData.push(['', '', '', '', '', '', '', 'TOTAL:', totalFootage, '', '', '', '', '', '']);

    // In production, this would use xlsx library:
    // const XLSX = require('xlsx');
    // const wb = XLSX.utils.book_new();
    // const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    // XLSX.utils.book_append_sheet(wb, ws, 'Daily Work Sheet');
    // XLSX.writeFile(wb, `DailyWorkSheet_${project?.id}_${selectedDate}.xlsx`);

    // For now, create a downloadable CSV
    const csvContent = worksheetData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DailyWorkSheet_${project?.id}_${selectedDate}.csv`;
    link.click();

    setGenerating(false);
  };

  // Stats
  const totalFootage = workEntries.reduce((sum, e) => sum + e.footage, 0);
  const totalDrills = new Set(workEntries.map(e => e.drill)).size;
  const totalContractors = new Set(workEntries.map(e => e.contractor.id)).size;

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
              <FileSpreadsheet size={28} color={accentPrimary} />
              Daily Work Sheet Generator
            </h1>
            <p style={{ color: mutedColor }}>Auto-generate Metronet format Excel files from GPS work data</p>
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
        <h3 style={{ color: textColor, marginBottom: '16px', fontWeight: '600' }}>Select Work Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
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
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={generateExcel}
              disabled={!selectedProject || workEntries.length === 0 || generating}
              style={{
                padding: '12px 24px',
                backgroundColor: (!selectedProject || workEntries.length === 0) ? '#6b7280' : accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: (!selectedProject || workEntries.length === 0) ? 'not-allowed' : 'pointer',
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
                  <Download size={18} /> Generate Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedProject && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          {[
            { label: 'Total Footage', value: totalFootage.toLocaleString() + ' ft', icon: MapPin, color: accentPrimary },
            { label: 'Active Drills', value: totalDrills, icon: Truck, color: accentSecondary },
            { label: 'Contractors', value: totalContractors, icon: Building, color: '#10b981' },
            { label: 'Work Entries', value: workEntries.length, icon: FileSpreadsheet, color: '#8b5cf6' },
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
              <stat.icon size={28} color={stat.color} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: textColor }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Work Entries Table / Preview */}
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
          alignItems: 'center'
        }}>
          <h3 style={{ color: textColor, fontWeight: '600', margin: 0 }}>
            Work Data Preview
          </h3>
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
            <Eye size={16} /> {showPreview ? 'Hide' : 'Show'} Excel Preview
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
            <RefreshCw size={32} className="spin" style={{ marginBottom: '12px' }} />
            <p>Loading work data...</p>
          </div>
        ) : !selectedProject ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
            <FileSpreadsheet size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontWeight: '500' }}>Select a project to view work data</p>
            <p style={{ fontSize: '0.9rem' }}>Data is automatically pulled from GPS and production logs</p>
          </div>
        ) : workEntries.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
            <AlertCircle size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontWeight: '500' }}>No work entries for this date</p>
            <p style={{ fontSize: '0.9rem' }}>Select a different date or check GPS work data</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#111827' : '#f8fafc' }}>
                  {['Contractor', 'Drill', 'Section', 'Type', 'Time', 'Footage', 'Location', 'Traffic Ctrl', '811 Ticket', 'Notes'].map(header => (
                    <th key={header} style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      fontWeight: '600', 
                      fontSize: '0.8rem', 
                      color: mutedColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '500', color: textColor }}>{entry.contractor.company}</div>
                      <div style={{ fontSize: '0.8rem', color: mutedColor }}>{entry.contractor.contact}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: textColor }}>{entry.drill}</td>
                    <td style={{ padding: '14px 16px', color: textColor, fontWeight: '600' }}>{entry.section}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: entry.sectionType === 'UG' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: entry.sectionType === 'UG' ? '#8b5cf6' : '#10b981'
                      }}>
                        {entry.sectionType === 'UG' ? 'Underground' : 'Aerial'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: textColor }}>
                      {entry.startTime} - {entry.endTime}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: accentPrimary }}>
                      {entry.footage} ft
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: textColor, fontSize: '0.9rem' }}>{entry.location}</div>
                      <div style={{ fontSize: '0.8rem', color: mutedColor }}>{entry.crossStreets}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {entry.trafficControl ? (
                        <CheckCircle size={18} color="#10b981" />
                      ) : (
                        <span style={{ color: mutedColor }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: textColor, fontSize: '0.85rem' }}>
                      {entry.locateTicket}
                    </td>
                    <td style={{ padding: '14px 16px', color: mutedColor, fontSize: '0.85rem', maxWidth: '200px' }}>
                      {entry.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: darkMode ? '#111827' : '#f0f9ff' }}>
                  <td colSpan={5} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: textColor }}>
                    Total Footage:
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '1.1rem', color: accentPrimary }}>
                    {totalFootage.toLocaleString()} ft
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Excel Format Preview */}
        {showPreview && workEntries.length > 0 && (
          <div style={{ 
            padding: '24px', 
            backgroundColor: darkMode ? '#111827' : '#f0fdf4',
            borderTop: `1px solid ${borderColor}`
          }}>
            <h4 style={{ color: textColor, marginBottom: '16px', fontWeight: '600' }}>
              📊 Excel Output Preview (Metronet Format)
            </h4>
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '8px', 
              padding: '16px', 
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#1f2937',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`DAILY WORK SHEET - METRONET
═══════════════════════════════════════════════════════════════

PROJECT: ${mockProjects.find(p => p.id === selectedProject)?.name || ''}
LCP CODE: ${mockProjects.find(p => p.id === selectedProject)?.lcpCode || ''}
DATE: ${selectedDate}
CLIENT: Metronet

───────────────────────────────────────────────────────────────
CONTRACTOR          | DRILL    | SECTION | TYPE | START | END   | FOOTAGE
───────────────────────────────────────────────────────────────
${workEntries.map(e => 
  `${e.contractor.company.padEnd(19)}| ${e.drill.padEnd(8)}| ${e.section.padEnd(7)}| ${e.sectionType.padEnd(4)}| ${e.startTime} | ${e.endTime} | ${e.footage} ft`
).join('\n')}
───────────────────────────────────────────────────────────────
                                                  TOTAL: ${totalFootage} ft
`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div style={{ 
        marginTop: '24px', 
        backgroundColor: darkMode ? '#1e3a5f' : '#eff6ff', 
        borderRadius: '12px', 
        padding: '20px',
        border: `1px solid ${darkMode ? '#2563eb' : '#bfdbfe'}`
      }}>
        <h4 style={{ color: darkMode ? '#93c5fd' : '#1d4ed8', marginBottom: '12px', fontWeight: '600' }}>
          ℹ️ How This Works
        </h4>
        <ul style={{ color: darkMode ? '#bfdbfe' : '#3b82f6', margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
          <li>Data is automatically pulled from GPS work sessions (WorkMap)</li>
          <li>Combines with daily production logs and 811 ticket information</li>
          <li>Excel output matches exact Metronet template format</li>
          <li>One sheet per day per project - multiple rows for multiple drills</li>
          <li>Can also generate weekly summaries and monthly reports</li>
        </ul>
      </div>

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

export default DailyWorkSheet;
