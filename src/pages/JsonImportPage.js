/**
 * LYT Communications - JSON Import Page
 * Version: 1.0.0
 * Route: #json-import-json
 * Admin-only: paste extraction JSON, validate, preview, import to DB
 */

import React, { useState } from 'react';
import {
  ArrowLeft, Upload, CheckCircle, AlertTriangle, Loader, Sun, Moon,
  FileText, DollarSign, Map, Zap, Box, ClipboardCheck
} from 'lucide-react';
import { VEXUS_RATES } from '../config/mapConfig';
import { importProjectFromExtraction } from '../services/mapService';

function JsonImportPage({ darkMode, setDarkMode, user, setCurrentPage }) {
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [projectId, setProjectId] = useState('');

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const successGreen = '#28a745';
  const errorRed = '#e85a4f';

  const handleValidate = () => {
    setImportResult(null);
    try {
      const data = JSON.parse(jsonText);
      setParsed(data);

      const warnings = [];
      const errors = [];

      // Check required sections
      if (!data.project) errors.push('Missing "project" section');
      if (!data.segments || !Array.isArray(data.segments)) errors.push('Missing or invalid "segments" array');
      if (!data.line_items || !Array.isArray(data.line_items)) warnings.push('Missing "line_items" array — billing data will be incomplete');
      if (!data.structures || !Array.isArray(data.structures)) warnings.push('Missing "structures" array');
      if (!data.splice_points || !Array.isArray(data.splice_points)) warnings.push('Missing "splice_points" array');

      // Validate rate card codes
      const unknownCodes = [];
      if (data.line_items) {
        for (const li of data.line_items) {
          if (li.code && !VEXUS_RATES[li.code]) {
            unknownCodes.push(li.code);
          }
        }
      }
      if (unknownCodes.length > 0) {
        warnings.push(`Unknown rate card codes: ${[...new Set(unknownCodes)].join(', ')}`);
      }

      // Calculate totals
      const totalFootage = (data.segments || []).reduce((sum, s) => sum + (parseFloat(s.footage) || 0), 0);
      const totalValue = (data.line_items || []).reduce((sum, li) => {
        const rate = VEXUS_RATES[li.code];
        return sum + ((parseFloat(li.quantity) || 0) * (rate ? rate.vexus : 0));
      }, 0);
      const contractorValue = (data.line_items || []).reduce((sum, li) => {
        const rate = VEXUS_RATES[li.code];
        return sum + ((parseFloat(li.quantity) || 0) * (rate ? rate.default_contractor : 0));
      }, 0);

      // Auto-generate project ID
      const name = data.project?.name || '';
      const autoId = name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 30) || `PROJ-${Date.now()}`;
      if (!projectId) setProjectId(autoId);

      setValidation({
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
          segments: (data.segments || []).length,
          structures: (data.structures || []).length,
          splicePoints: (data.splice_points || []).length,
          lineItems: (data.line_items || []).length,
          totalFootage,
          totalValue,
          contractorValue,
          margin: totalValue - contractorValue,
        },
      });
    } catch (err) {
      setParsed(null);
      setValidation({
        valid: false,
        errors: [`Invalid JSON: ${err.message}`],
        warnings: [],
        stats: null,
      });
    }
  };

  const handleImport = async () => {
    if (!parsed || !validation?.valid || !projectId.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importProjectFromExtraction(parsed, projectId.trim());
      setImportResult(result);
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>
      {/* Header */}
      <div style={{
        backgroundColor: darkMode ? '#112240' : '#f1f5f9',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${borderColor}`, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setCurrentPage('admin-dashboard')}
            style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
            <ArrowLeft size={20} /> Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>
            <span style={{ color: accent }}>JSON</span> Import
          </h1>
        </div>
        <button onClick={() => setDarkMode && setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {darkMode ? <Sun size={18} color="#FFB800" /> : <Moon size={18} color="#64748b" />}
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
        {/* Paste JSON */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.95rem' }}>
            Paste Extraction JSON
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setParsed(null); setValidation(null); setImportResult(null); }}
            placeholder='Paste the JSON output from LYT Extractor or Claude extraction here...'
            style={{
              width: '100%', minHeight: 250, padding: 16, borderRadius: 10,
              border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: text,
              fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Validate Button */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleValidate}
            disabled={!jsonText.trim()}
            style={{
              backgroundColor: !jsonText.trim() ? '#6c757d' : accent,
              color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10,
              cursor: !jsonText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 600,
            }}>
            <ClipboardCheck size={18} /> Validate
          </button>
          {validation && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: validation.valid ? successGreen : errorRed,
              fontWeight: 600, fontSize: '0.9rem',
            }}>
              {validation.valid ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              {validation.valid ? 'Valid JSON' : 'Validation failed'}
            </span>
          )}
        </div>

        {/* Validation Results */}
        {validation && (
          <>
            {/* Errors */}
            {validation.errors.length > 0 && (
              <div style={{
                backgroundColor: `${errorRed}12`, border: `1px solid ${errorRed}44`,
                borderRadius: 10, padding: 16, marginBottom: 16,
              }}>
                <h4 style={{ margin: '0 0 8px', color: errorRed, fontSize: '0.9rem' }}>Errors</h4>
                {validation.errors.map((e, i) => (
                  <div key={i} style={{ color: errorRed, fontSize: '0.85rem', marginBottom: 4 }}>- {e}</div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div style={{
                backgroundColor: '#FFB80012', border: '1px solid #FFB80044',
                borderRadius: 10, padding: 16, marginBottom: 16,
              }}>
                <h4 style={{ margin: '0 0 8px', color: '#FFB800', fontSize: '0.9rem' }}>Warnings</h4>
                {validation.warnings.map((w, i) => (
                  <div key={i} style={{ color: '#FFB800', fontSize: '0.85rem', marginBottom: 4 }}>- {w}</div>
                ))}
              </div>
            )}

            {/* Summary Panel */}
            {validation.stats && (
              <div style={{
                backgroundColor: cardBg, border: `1px solid ${borderColor}`,
                borderRadius: 12, padding: 20, marginBottom: 24,
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>Extraction Summary</h3>

                {/* Project info */}
                {parsed?.project && (
                  <div style={{ marginBottom: 16, padding: 12, backgroundColor: darkMode ? '#0a1628' : '#f1f5f9', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{parsed.project.name}</div>
                    <div style={{ fontSize: '0.8rem', color: textMuted }}>
                      {parsed.project.client} &bull; {parsed.project.region} &bull; {parsed.project.rate_card}
                      {parsed.project.work_order_number && ` &bull; WO: ${parsed.project.work_order_number}`}
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Segments', value: validation.stats.segments, icon: <Map size={16} />, color: '#2196F3' },
                    { label: 'Structures', value: validation.stats.structures, icon: <Box size={16} />, color: '#4CAF50' },
                    { label: 'Splice Points', value: validation.stats.splicePoints, icon: <Zap size={16} />, color: '#FFB800' },
                    { label: 'Line Items', value: validation.stats.lineItems, icon: <FileText size={16} />, color: accent },
                    { label: 'Total Footage', value: `${validation.stats.totalFootage.toLocaleString()} LF`, icon: <Map size={16} />, color: '#2196F3' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      padding: 12, borderRadius: 8,
                      border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: textMuted }}>{stat.label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{stat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Billing summary — admin only */}
                <div style={{
                  padding: 14, borderRadius: 8,
                  backgroundColor: darkMode ? '#0a1628' : '#f0fdf4',
                  border: `1px solid ${successGreen}33`,
                }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={16} color={successGreen} /> Estimated Billing
                  </h4>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: textMuted }}>Vexus Total: </span>
                      <span style={{ fontWeight: 700, color: successGreen }}>${validation.stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span style={{ color: textMuted }}>Contractor Cost: </span>
                      <span style={{ fontWeight: 600 }}>${validation.stats.contractorValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span style={{ color: textMuted }}>Margin: </span>
                      <span style={{ fontWeight: 700, color: accent }}>${validation.stats.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project ID + Import */}
            {validation.valid && (
              <div style={{
                backgroundColor: cardBg, border: `1px solid ${borderColor}`,
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                    Project ID
                  </label>
                  <input
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="e.g. SLPH.01.006"
                    style={{
                      width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${borderColor}`, backgroundColor: darkMode ? '#0d1b2a' : '#fff',
                      color: text, fontSize: '0.9rem', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 4 }}>
                    Unique ID for this project in the database
                  </div>
                </div>

                <button onClick={handleImport}
                  disabled={importing || !projectId.trim()}
                  style={{
                    backgroundColor: (importing || !projectId.trim()) ? '#6c757d' : successGreen,
                    color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10,
                    cursor: (importing || !projectId.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 700,
                  }}>
                  {importing ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} />}
                  {importing ? 'Importing...' : 'Import to Database'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Import Result */}
        {importResult && (
          <div style={{
            marginTop: 24, padding: 20, borderRadius: 12,
            backgroundColor: importResult.success ? `${successGreen}12` : `${errorRed}12`,
            border: `1px solid ${importResult.success ? successGreen : errorRed}44`,
          }}>
            <h3 style={{ margin: '0 0 12px', color: importResult.success ? successGreen : errorRed, display: 'flex', alignItems: 'center', gap: 8 }}>
              {importResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
            </h3>
            {importResult.counts && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: 12 }}>
                <span>Project: {importResult.counts.project}</span>
                <span>Segments: {importResult.counts.segments}</span>
                <span>Structures: {importResult.counts.structures}</span>
                <span>Splices: {importResult.counts.splicePoints}</span>
                <span>Line Items: {importResult.counts.lineItems}</span>
              </div>
            )}
            {importResult.errors && (
              <div style={{ fontSize: '0.8rem', color: errorRed, maxHeight: 150, overflowY: 'auto' }}>
                {importResult.errors.map((e, i) => <div key={i}>- {e}</div>)}
              </div>
            )}
            {importResult.success && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentPage('project-map')}
                  style={{ backgroundColor: accent, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                  <Map size={16} /> View on Map
                </button>
                <button onClick={() => setCurrentPage('admin-projects')}
                  style={{ backgroundColor: cardBg, color: text, border: `1px solid ${borderColor}`, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                  <FileText size={16} /> Projects Overview
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default JsonImportPage;
