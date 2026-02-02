/**
 * LYT Communications - Job Import Page
 * Version: 1.0.0
 * Created: 2026-02-02
 * Route: #job-import
 * 
 * Upload work order PDFs and construction map PDFs.
 * AI extracts project metadata, segments, splice points,
 * and matches to rate cards for billing.
 */

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Loader, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function JobImportPage({ darkMode, setDarkMode, user, setCurrentPage }) {
  const [workOrderFile, setWorkOrderFile] = useState(null);
  const [mapFile, setMapFile] = useState(null);
  const [rateCardId, setRateCardId] = useState('vexus-la-tx-2026');
  const [processing, setProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [dragOverWork, setDragOverWork] = useState(false);
  const [dragOverMap, setDragOverMap] = useState(false);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  // eslint-disable-next-line no-unused-vars
  const accentHover = darkMode ? '#e060d8' : '#005a8c';
  const successGreen = '#28a745';
  const errorRed = '#e85a4f';

  // File drop handlers
  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverWork(false);
    setDragOverMap(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are accepted');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError('File must be under 25MB');
        return;
      }
      setError(null);
      if (type === 'workorder') setWorkOrderFile(file);
      else setMapFile(file);
    }
  }, []);

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File must be under 25MB');
      return;
    }
    setError(null);
    if (type === 'workorder') setWorkOrderFile(file);
    else setMapFile(file);
  };

  const handleImport = async () => {
    if (!workOrderFile) {
      setError('Work order PDF is required');
      return;
    }

    setProcessing(true);
    setError(null);
    setImportResult(null);

    try {
      // For Phase 1, we'll simulate the AI extraction
      // Phase 2 will connect this to the actual Claude API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Demo result structure matching the build plan schema
      const result = {
        project: {
          project_id: 'VXS-SLPH01-006',
          customer: 'Vexus Fiber',
          project_name: 'Sulphur LA City Build',
          po_number: '3160880',
          total_value: 421712.30,
          start_date: '2026-02-05',
          completion_date: '2029-01-09',
          status: 'Active',
          rate_card_id: rateCardId,
        },
        segments: [
          { segment_id: 'VXS-SLPH01-006-A-A01', contractor_id: 'A→A01', section: 'A', from_handhole: 'A (17x30x18)', to_handhole: 'A01 (15x20x12)', footage: 148, street: 'W Parish Rd', boring_status: 'Not Started' },
          { segment_id: 'VXS-SLPH01-006-A-A02', contractor_id: 'A01→A02', section: 'A', from_handhole: 'A01 (15x20x12)', to_handhole: 'A02 (15x20x12)', footage: 132, street: 'W Parish Rd', boring_status: 'Not Started' },
          { segment_id: 'VXS-SLPH01-006-A-A03', contractor_id: 'A02→A03', section: 'A', from_handhole: 'A02 (15x20x12)', to_handhole: 'A03 (15x20x12)', footage: 156, street: 'Beglis Pkwy', boring_status: 'Not Started' },
          { segment_id: 'VXS-SLPH01-006-B-B01', contractor_id: 'B→B01', section: 'B', from_handhole: 'B (17x30x18)', to_handhole: 'B01 (15x20x12)', footage: 210, street: 'S Cities Service Hwy', boring_status: 'Not Started' },
          { segment_id: 'VXS-SLPH01-006-B-B02', contractor_id: 'B01→B02', section: 'B', from_handhole: 'B01 (15x20x12)', to_handhole: 'B02 (15x20x12)', footage: 185, street: 'S Cities Service Hwy', boring_status: 'Not Started' },
        ],
        splice_points: [
          { splice_id: 'VXS-SLPH01-006-SPL-A01', location: 'A01', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', fiber_count: 2, status: 'Not Started' },
          { splice_id: 'VXS-SLPH01-006-SPL-A02', location: 'A02', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', fiber_count: 2, status: 'Not Started' },
          { splice_id: 'VXS-SLPH01-006-SPL-A03', location: 'A03', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'end-of-line', fiber_count: 2, status: 'Not Started' },
          { splice_id: 'VXS-SLPH01-006-SPL-B01', location: 'B01', handhole_type: '15x20x12 TB', splice_type: '1x4', position_type: 'mid-span', fiber_count: 2, status: 'Not Started' },
        ],
        stats: {
          totalSegments: 5,
          totalFootage: 831,
          totalSplicePoints: 4,
          estimatedValue: 421712.30,
        },
      };

      setImportResult(result);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult) return;
    
    setProcessing(true);
    try {
      // Phase 2: Push to Google Sheets via Gateway
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Project imported successfully! Redirecting to project dashboard...');
      if (setCurrentPage) setCurrentPage('admin-dashboard');
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const DropZone = ({ type, file, setFile, dragOver, setDragOver, label, icon }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => handleDrop(e, type)}
      onClick={() => document.getElementById(`file-${type}`).click()}
      style={{
        border: `2px dashed ${dragOver ? accent : file ? successGreen : borderColor}`,
        borderRadius: '12px',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: dragOver ? (darkMode ? '#1a2f4a' : '#f0f9ff') : (file ? (darkMode ? '#0a2a1a' : '#f0fdf4') : cardBg),
        transition: 'all 0.2s ease',
        flex: 1,
        minWidth: '280px',
      }}
    >
      <input
        id={`file-${type}`}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileSelect(e, type)}
        style={{ display: 'none' }}
      />
      {file ? (
        <div>
          <CheckCircle size={40} color={successGreen} style={{ marginBottom: '12px' }} />
          <p style={{ color: text, fontWeight: 600, margin: '0 0 4px' }}>{file.name}</p>
          <p style={{ color: textMuted, fontSize: '0.85rem', margin: '0 0 12px' }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            style={{
              background: 'none',
              border: `1px solid ${errorRed}`,
              color: errorRed,
              padding: '6px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      ) : (
        <div>
          {icon}
          <p style={{ color: text, fontWeight: 600, margin: '12px 0 4px' }}>{label}</p>
          <p style={{ color: textMuted, fontSize: '0.85rem', margin: 0 }}>
            Drag & drop PDF here or click to browse
          </p>
          <p style={{ color: textMuted, fontSize: '0.75rem', margin: '8px 0 0' }}>
            PDF only, max 25MB
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>
      {/* Header */}
      <div style={{
        backgroundColor: darkMode ? '#112240' : '#f1f5f9',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setCurrentPage && setCurrentPage('admin-dashboard')}
            style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>
            <span style={{ color: accent }}>Import</span> Work Order
          </h1>
        </div>
        <button
          onClick={() => setDarkMode && setDarkMode(!darkMode)}
          style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
        
        {/* Step 1: Upload Files */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${borderColor}`,
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
            Step 1: Upload PDFs
          </h2>
          <p style={{ color: textMuted, margin: '0 0 20px', fontSize: '0.9rem' }}>
            Upload the Metronet work order and construction map PDFs. The AI will extract all project data automatically.
          </p>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <DropZone
              type="workorder"
              file={workOrderFile}
              setFile={setWorkOrderFile}
              dragOver={dragOverWork}
              setDragOver={setDragOverWork}
              label="Work Order PDF *"
              icon={<FileText size={40} color={accent} />}
            />
            <DropZone
              type="map"
              file={mapFile}
              setFile={setMapFile}
              dragOver={dragOverMap}
              setDragOver={setDragOverMap}
              label="Construction Map PDF"
              icon={<Upload size={40} color={accent} />}
            />
          </div>
        </div>

        {/* Step 2: Rate Card Selection */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${borderColor}`,
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
            Step 2: Select Rate Card
          </h2>
          <select
            value={rateCardId}
            onChange={(e) => setRateCardId(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              color: text,
              fontSize: '0.95rem',
            }}
          >
            <option value="vexus-la-tx-2026">Vexus LA/TX 2026</option>
            <option value="metronet-2026">Metronet 2026 (coming soon)</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: darkMode ? '#2a0a0a' : '#fef2f2',
            border: `1px solid ${errorRed}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <AlertCircle size={20} color={errorRed} />
            <span style={{ color: errorRed }}>{error}</span>
          </div>
        )}

        {/* Process Button */}
        {!importResult && (
          <button
            onClick={handleImport}
            disabled={!workOrderFile || processing}
            style={{
              backgroundColor: (!workOrderFile || processing) ? '#6c757d' : accent,
              color: '#ffffff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: (!workOrderFile || processing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            {processing ? (
              <>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Processing with AI...
              </>
            ) : (
              <>
                <Upload size={20} />
                Extract Project Data
              </>
            )}
          </button>
        )}

        {/* Step 3: Import Preview */}
        {importResult && (
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: `1px solid ${successGreen}`,
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: successGreen }}>
              <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Step 3: Review Extracted Data
            </h2>

            {/* Project Summary */}
            <div style={{
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              border: `1px solid ${borderColor}`,
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Project Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  ['Project ID', importResult.project.project_id],
                  ['Customer', importResult.project.customer],
                  ['Project Name', importResult.project.project_name],
                  ['PO Number', importResult.project.po_number],
                  ['Total Value', `$${importResult.project.total_value.toLocaleString()}`],
                  ['Start Date', importResult.project.start_date],
                  ['Completion Date', importResult.project.completion_date],
                  ['Rate Card', importResult.project.rate_card_id],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ color: textMuted, fontSize: '0.8rem', margin: '0 0 2px' }}>{label}</p>
                    <p style={{ margin: 0, fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                ['Segments', importResult.stats.totalSegments, accent],
                ['Total Footage', `${importResult.stats.totalFootage.toLocaleString()} LF`, '#FFB800'],
                ['Splice Points', importResult.stats.totalSplicePoints, '#4CAF50'],
                ['Est. Value', `$${importResult.stats.estimatedValue.toLocaleString()}`, successGreen],
              ].map(([label, value, color]) => (
                <div key={label} style={{
                  backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                  borderRadius: '8px',
                  padding: '16px',
                  flex: '1',
                  minWidth: '140px',
                  textAlign: 'center',
                  border: `1px solid ${borderColor}`,
                }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color, margin: '0 0 4px' }}>{value}</p>
                  <p style={{ color: textMuted, fontSize: '0.8rem', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Segments List */}
            <div style={{
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              marginBottom: '16px',
            }}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'segments' ? null : 'segments')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  color: text,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Segments ({importResult.segments.length})
                {expandedSection === 'segments' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'segments' && (
                <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                        {['ID', 'Section', 'From', 'To', 'Footage', 'Street'].map(h => (
                          <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.segments.map(seg => (
                        <tr key={seg.segment_id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{seg.contractor_id}</td>
                          <td style={{ padding: '8px' }}>{seg.section}</td>
                          <td style={{ padding: '8px' }}>{seg.from_handhole}</td>
                          <td style={{ padding: '8px' }}>{seg.to_handhole}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{seg.footage} LF</td>
                          <td style={{ padding: '8px' }}>{seg.street}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Splice Points List */}
            <div style={{
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              marginBottom: '24px',
            }}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'splices' ? null : 'splices')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  color: text,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Splice Points ({importResult.splice_points.length})
                {expandedSection === 'splices' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'splices' && (
                <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                        {['Location', 'Handhole', 'Type', 'Position', 'Fibers'].map(h => (
                          <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.splice_points.map(sp => (
                        <tr key={sp.splice_id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{sp.location}</td>
                          <td style={{ padding: '8px' }}>{sp.handhole_type}</td>
                          <td style={{ padding: '8px' }}>{sp.splice_type}</td>
                          <td style={{ padding: '8px' }}>{sp.position_type}</td>
                          <td style={{ padding: '8px' }}>{sp.fiber_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Confirm / Cancel Buttons */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleConfirmImport}
                disabled={processing}
                style={{
                  backgroundColor: successGreen,
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                {processing ? (
                  <><Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                ) : (
                  <><CheckCircle size={20} /> Confirm & Create Project</>
                )}
              </button>
              <button
                onClick={() => { setImportResult(null); setWorkOrderFile(null); setMapFile(null); }}
                style={{
                  backgroundColor: 'transparent',
                  color: errorRed,
                  border: `1px solid ${errorRed}`,
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Version */}
      <div style={{ position: 'fixed', bottom: '4px', right: '8px', fontSize: '0.6rem', color: 'transparent', userSelect: 'none' }}
        onDoubleClick={(e) => { e.target.style.color = textMuted; }}
      >
        JobImportPage v1.0.0
      </div>
    </div>
  );
}

export default JobImportPage;
