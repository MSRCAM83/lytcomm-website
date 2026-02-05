/**
 * LYT Communications - Job Import Page
 * Version: 4.1.0
 * Updated: 2026-02-04
 * Route: #job-import
 * 
 * v4.1.0: COMPLETE 4-BUCKET EXTRACTION - Segments + Splices (with billing) +
 *         Unallocated WO items. Fixed: splice billing was being excluded.
 *         Added: WO line items display, unallocated items display, reconciliation.
 *         Fixed: text extraction preserves line breaks for table data.
 * v4.0.0: MAP TILING - Renders map pages at 4.0x scale, then tiles into
 *         legend crop + 6 map section tiles (3x2 grid). Each tile is
 *         ~1175x1584px = under Claude Vision's 1568 native threshold.
 *         Result: 6.9x more detail per section vs single full-page image.
 *         Footage numbers, handhole labels, and splice callouts now readable.
 * v3.3.0: Split processing - WO as text only, map at max quality.
 * v3.0.0: Renders PDF pages to images for Claude Vision API.
 */

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Loader, Trash2, ChevronDown, ChevronUp, Image, Eye } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
const PDFJS_VERSION = pdfjsLib.version || '4.8.69';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

// Work order: text-only extraction
const MAX_PAGES_WORKORDER = 10;
// Map: high-res tiled images
const MAX_PAGES_MAP = 4;

// ============================================================
// MAP TILING CONFIG
// ============================================================
// 4.0x scale: 11"x17" page → 4896x3168 (15.5M pixels, under Safari 16M limit)
const MAP_RENDER_SCALE = 4.0;
const MAP_JPEG_QUALITY = 0.85; // Higher quality for sharp text
// Tile grid: 3 columns x 2 rows = 6 map tiles per page
const TILE_COLS = 3;
const TILE_ROWS = 2;
// Legend is in the right ~28% of the page, top ~55%
const LEGEND_X_RATIO = 0.72;
const LEGEND_TOP_RATIO = 0.0;
const LEGEND_BOTTOM_RATIO = 0.55;

// Legacy fallbacks
const RENDER_SCALE = 1.5;
const JPEG_QUALITY = 0.55;

function JobImportPage({ darkMode, setDarkMode, user, setCurrentPage }) {
  const [workOrderFile, setWorkOrderFile] = useState(null);
  const [mapFile, setMapFile] = useState(null);
  const [rateCardId, setRateCardId] = useState('vexus-la-tx-2026');
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
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
  const successGreen = '#28a745';
  const errorRed = '#e85a4f';

  /**
   * Render a single PDF page to a canvas and return the canvas
   */
  const renderPageToCanvas = async (page, scale) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  };

  /**
   * Crop a region from a canvas and return base64 JPEG
   */
  const cropCanvasToBase64 = (sourceCanvas, x, y, w, h, quality) => {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);
    const dataUrl = cropCanvas.toDataURL('image/jpeg', quality);
    cropCanvas.width = 0;
    cropCanvas.height = 0;
    return dataUrl.split(',')[1];
  };

  /**
   * Tile a rendered map page into legend + grid sections
   * Returns array of { base64, label, index } objects
   */
  const tileMapPage = (canvas, pageNum) => {
    const W = canvas.width;
    const H = canvas.height;
    const tiles = [];

    // 1. Legend crop (right portion, top half)
    const legendX = Math.floor(W * LEGEND_X_RATIO);
    const legendY = Math.floor(H * LEGEND_TOP_RATIO);
    const legendW = W - legendX;
    const legendH = Math.floor(H * LEGEND_BOTTOM_RATIO) - legendY;

    if (legendW > 100 && legendH > 100) {
      tiles.push({
        base64: cropCanvasToBase64(canvas, legendX, legendY, legendW, legendH, MAP_JPEG_QUALITY),
        label: `Page ${pageNum} - LEGEND`,
        index: 0,
      });
      const sizeKB = Math.round(tiles[tiles.length - 1].base64.length * 0.75 / 1024);
      console.log(`Legend tile: ${legendW}x${legendH} = ${sizeKB}KB`);
    }

    // 2. Key Map crop (right portion, bottom half - if exists)
    const keyY = Math.floor(H * LEGEND_BOTTOM_RATIO);
    const keyW = W - legendX;
    const keyH = H - keyY;
    if (keyW > 100 && keyH > 100) {
      tiles.push({
        base64: cropCanvasToBase64(canvas, legendX, keyY, keyW, keyH, MAP_JPEG_QUALITY),
        label: `Page ${pageNum} - KEY MAP`,
        index: 1,
      });
      const sizeKB = Math.round(tiles[tiles.length - 1].base64.length * 0.75 / 1024);
      console.log(`Key Map tile: ${keyW}x${keyH} = ${sizeKB}KB`);
    }

    // 3. Map area tiles (left portion, full height, grid of TILE_COLS x TILE_ROWS)
    const mapW = Math.floor(W * LEGEND_X_RATIO);
    const mapH = H;
    const tileW = Math.floor(mapW / TILE_COLS);
    const tileH = Math.floor(mapH / TILE_ROWS);

    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        const tx = col * tileW;
        const ty = row * tileH;
        // Last column/row gets any remaining pixels
        const tw = (col === TILE_COLS - 1) ? (mapW - tx) : tileW;
        const th = (row === TILE_ROWS - 1) ? (mapH - ty) : tileH;

        const tileLabel = `Page ${pageNum} - Section R${row + 1}C${col + 1}`;
        tiles.push({
          base64: cropCanvasToBase64(canvas, tx, ty, tw, th, MAP_JPEG_QUALITY),
          label: tileLabel,
          index: 2 + row * TILE_COLS + col,
        });
        const sizeKB = Math.round(tiles[tiles.length - 1].base64.length * 0.75 / 1024);
        console.log(`${tileLabel}: ${tw}x${th} = ${sizeKB}KB`);
      }
    }

    return tiles;
  };

  /**
   * Process a PDF - extract text and optionally render to images/tiles
   */
  const processPdf = async (file, label, maxPages, opts = {}) => {
    const scale = opts.scale || RENDER_SCALE;
    const quality = opts.quality || JPEG_QUALITY;
    const textOnly = opts.textOnly || false;
    const tileMode = opts.tileMode || false;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const pagesToRender = Math.min(pageCount, maxPages);

    const images = [];
    const tileData = []; // For tile mode: array of { base64, label, index }
    let fullText = '';

    for (let i = 1; i <= pagesToRender; i++) {
      setProgressMsg(`${label}: Processing page ${i}/${pagesToRender}...`);
      const page = await pdf.getPage(i);

      // Extract text - preserve line structure for table data
      try {
        const content = await page.getTextContent();
        // Group text items by Y position to preserve rows
        const items = content.items;
        if (items.length > 0) {
          let lastY = null;
          let lineText = '';
          const lines = [];
          for (const item of items) {
            const y = Math.round(item.transform[5]); // Y position
            if (lastY !== null && Math.abs(y - lastY) > 3) {
              // New line (Y position changed)
              if (lineText.trim()) lines.push(lineText.trim());
              lineText = item.str;
            } else {
              // Same line - add with separator
              lineText += (lineText && item.str ? '  ' : '') + item.str;
            }
            lastY = y;
          }
          if (lineText.trim()) lines.push(lineText.trim());
          const pageText = lines.join('\n');
          if (pageText.length > 5) {
            fullText += `\n--- Page ${i} ---\n${pageText}`;
          }
        }
      } catch (e) {
        console.warn(`Text extraction failed for page ${i}:`, e);
      }

      if (textOnly) continue;

      try {
        if (tileMode) {
          // TILE MODE: Render at high res, then crop into tiles
          setProgressMsg(`${label}: Rendering page ${i} at ${scale}x for tiling...`);
          const canvas = await renderPageToCanvas(page, scale);
          console.log(`${label} page ${i}: Full canvas ${canvas.width}x${canvas.height} at ${scale}x`);

          setProgressMsg(`${label}: Tiling page ${i} into legend + ${TILE_COLS * TILE_ROWS} sections...`);
          const pageTiles = tileMapPage(canvas, i);
          tileData.push(...pageTiles);

          // Cleanup the full canvas
          canvas.width = 0;
          canvas.height = 0;
        } else {
          // LEGACY MODE: Single image per page
          const canvas = await renderPageToCanvas(page, scale);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          images.push(dataUrl.split(',')[1]);
          const sizeKB = Math.round(images[images.length - 1].length * 0.75 / 1024);
          console.log(`${label} page ${i}: ${sizeKB}KB (${canvas.width}x${canvas.height})`);
          canvas.width = 0;
          canvas.height = 0;
        }
      } catch (renderErr) {
        console.warn(`Page ${i} render failed:`, renderErr);
      }
    }

    if (pageCount > maxPages) {
      fullText += `\n\n[NOTE: PDF has ${pageCount} pages but only first ${maxPages} were processed]`;
    }

    return { images, tiles: tileData, text: fullText.trim(), pageCount };
  };

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
    setProgressMsg('Starting PDF processing...');

    try {
      // Process work order PDF → TEXT ONLY
      let woText = '';
      try {
        setProgressMsg('Extracting work order text...');
        const woResult = await processPdf(workOrderFile, 'Work Order', MAX_PAGES_WORKORDER, { textOnly: true });
        woText = woResult.text;
        setProgressMsg(`Work order: ${woResult.pageCount} pages, ${woText.length} chars text`);
      } catch (pdfErr) {
        console.error('Work order PDF processing failed:', pdfErr);
        setError(`Failed to process work order PDF: ${pdfErr.message}`);
        setProcessing(false);
        return;
      }

      // Process construction map PDF → HIGH-RES TILED IMAGES
      let mapTiles = [];
      let mapText = '';
      if (mapFile) {
        try {
          setProgressMsg('Rendering construction map at 4.0x for tiling...');
          const mapResult = await processPdf(mapFile, 'Map', MAX_PAGES_MAP, {
            scale: MAP_RENDER_SCALE,
            quality: MAP_JPEG_QUALITY,
            tileMode: true,
          });
          mapTiles = mapResult.tiles;
          mapText = mapResult.text;
          const totalTileKB = mapTiles.reduce((sum, t) => sum + Math.round(t.base64.length * 0.75 / 1024), 0);
          setProgressMsg(`Map: ${mapResult.pageCount} pages → ${mapTiles.length} tiles (${(totalTileKB / 1024).toFixed(1)}MB total)`);
          console.log(`Map tiling complete: ${mapTiles.length} tiles, ${(totalTileKB / 1024).toFixed(1)}MB`);
        } catch (pdfErr) {
          console.warn('Map PDF tiling failed:', pdfErr);
          // Non-fatal
        }
      }

      // Validate
      if (woText.length < 30 && mapTiles.length === 0) {
        setError('No content extracted. Work order needs text, map needs images.');
        setProcessing(false);
        return;
      }

      // Build payload with tiled map images
      const tileImages = mapTiles.map(t => t.base64);
      const tileLabels = mapTiles.map(t => t.label);

      const payload = {
        work_order_text: woText.length > 30 ? woText : undefined,
        map_text: mapText.length > 30 ? mapText : undefined,
        map_images: tileImages.length > 0 ? tileImages : undefined,
        map_tile_labels: tileLabels.length > 0 ? tileLabels : undefined,
        rate_card_id: rateCardId,
      };

      const payloadStr = JSON.stringify(payload);
      const payloadMB = (payloadStr.length / (1024 * 1024)).toFixed(1);
      console.log(`Payload: ${payloadMB}MB (WO text: ${(woText.length / 1024).toFixed(0)}KB + ${tileImages.length} map tiles)`);

      // Size guard - if over Vercel limit, reduce tile count
      if (payloadStr.length > 48 * 1024 * 1024) {
        setProgressMsg(`Payload too large (${payloadMB}MB). Reducing tiles...`);
        // Keep legend + first page tiles only
        const maxTiles = 8;
        if (tileImages.length > maxTiles) {
          payload.map_images = tileImages.slice(0, maxTiles);
          payload.map_tile_labels = tileLabels.slice(0, maxTiles);
          console.log(`Reduced to ${maxTiles} tiles`);
        }
      }

      setProgressMsg(`Sending ${tileImages.length} high-res map tiles + work order to AI (${payloadMB}MB)...`);

      const response = await fetch('/api/pdf-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `API returned ${response.status}`);
      }

      const data = await response.json();

      console.log('API response keys:', Object.keys(data));

      if (data.warning) {
        const preview = (data.raw_response || '').substring(0, 200);
        setError(`AI could not parse extraction. Preview: ${preview || 'empty'}. Check console (F12).`);
        console.warn('Full raw AI response:', data.raw_response);
        setProcessing(false);
        return;
      }

      if (!data.success || !data.extracted) {
        console.error('Unexpected response:', JSON.stringify(data).substring(0, 500));
        throw new Error(`No extraction data returned. Keys: ${Object.keys(data).join(', ')}`);
      }

      setProgressMsg('Building project preview...');

      const ext = data.extracted;
      const projectId = ext.project?.project_id || 'VXS-SLPH01-006';

      const result = {
        project: {
          project_id: projectId,
          customer: ext.project?.customer || 'Vexus Fiber',
          project_name: ext.project?.project_name || '',
          po_number: ext.project?.po_number || '',
          total_value: ext.project?.total_value || ext.grand_total || 0,
          start_date: ext.project?.start_date || '',
          completion_date: ext.project?.completion_date || '',
          status: 'Active',
          rate_card_id: rateCardId,
        },
        work_order_line_items: (ext.work_order_line_items || []).map(li => ({
          code: li.code || '',
          description: li.description || '',
          qty: li.qty || 0,
          uom: li.uom || '',
          rate: li.rate || 0,
          total: li.total || 0,
        })),
        segments: (ext.segments || []).map((seg, i) => ({
          segment_id: `${projectId}-${seg.section || 'X'}-${(seg.to_handhole || `S${i}`).replace(/[^A-Za-z0-9]/g, '')}`,
          contractor_id: seg.contractor_id || `${seg.from_handhole}→${seg.to_handhole}`,
          section: seg.section || '',
          from_handhole: seg.from_handhole ? `${seg.from_handhole} (${seg.from_hh_size || ''})` : '',
          to_handhole: seg.to_handhole ? `${seg.to_handhole} (${seg.to_hh_size || ''})` : '',
          footage: seg.footage || 0,
          street: seg.street || '',
          duct_count: seg.duct_count || null,
          cable_type: seg.cable_type || null,
          boring_status: 'Not Started',
          work_items: seg.work_items || [],
          total_value: seg.total_value || 0,
        })),
        splice_points: (ext.splice_points || []).map(sp => ({
          splice_id: `${projectId}-SPL-${(sp.contractor_id || '').replace(/[^A-Za-z0-9]/g, '')}`,
          contractor_id: sp.contractor_id || '',
          location: sp.location || '',
          handhole_type: sp.handhole_type || '',
          splice_type: sp.splice_type || '',
          position_type: sp.position_type || '',
          fiber_count: sp.fiber_count || 2,
          tray_count: sp.tray_count || 1,
          status: 'Not Started',
          work_items: sp.work_items || [],
          total_value: sp.total_value || 0,
        })),
        unallocated_items: (ext.unallocated_items || []).map(ui => ({
          code: ui.code || '',
          description: ui.description || '',
          qty: ui.qty || 0,
          uom: ui.uom || '',
          rate: ui.rate || 0,
          total: ui.total || 0,
        })),
        stats: {
          totalSegments: ext.total_segments || (ext.segments || []).length,
          totalFootage: ext.total_footage || (ext.segments || []).reduce((sum, s) => sum + (s.footage || 0), 0),
          totalSplicePoints: ext.total_splice_points || (ext.splice_points || []).length,
          segmentsTotal: ext.segments_total || (ext.segments || []).reduce((sum, s) => sum + (s.total_value || 0), 0),
          splicesTotal: ext.splices_total || (ext.splice_points || []).reduce((sum, s) => sum + (s.total_value || 0), 0),
          unallocatedTotal: ext.unallocated_total || (ext.unallocated_items || []).reduce((sum, u) => sum + (u.total || 0), 0),
          grandTotal: ext.grand_total || 0,
          woTotal: ext.project?.total_value || 0,
        },
        _usage: data.usage,
        _raw: ext,
      };

      setImportResult(result);
      setProgressMsg('');
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      console.error('Import error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult) return;

    setProcessing(true);
    setError(null);
    try {
      const { importProject } = await import('../services/mapService');

      const projectId = importResult.project.project_id;

      // Pass the FULL extraction data to importProject
      // This includes: project, handholes, flowerpots, ground_rods, segments, splice_points
      const result = await importProject(importResult, projectId);

      if (result.success) {
        const c = result.counts;
        const msg = `Project imported successfully!\n\n` +
          `✅ Project: ${projectId}\n` +
          `✅ Handholes: ${c.handholes || 0}\n` +
          `✅ Flowerpots: ${c.flowerpots || 0}\n` +
          `✅ Ground Rods: ${c.groundRods || 0}\n` +
          `✅ Segments: ${c.segments || 0}\n` +
          `✅ Splice Points: ${c.splicePoints || 0}\n\n` +
          `Redirecting to project map...`;
        alert(msg);
        if (setCurrentPage) setCurrentPage('project-map');
      } else {
        const errMsg = result.errors ? result.errors.join('\n') : 'Unknown error';
        const c = result.counts || {};
        setError(`Partial import - some items failed:\n${errMsg}\n\nWritten: ${c.handholes || 0} HH, ${c.flowerpots || 0} FP, ${c.groundRods || 0} GR, ${c.segments || 0} SEG, ${c.splicePoints || 0} SP`);
      }
    } catch (err) {
      setError(`Save failed: ${err.message}`);
      console.error('Confirm import error:', err);
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
            <Image size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Step 1: Upload PDFs
          </h2>
          <p style={{ color: textMuted, margin: '0 0 6px', fontSize: '0.9rem' }}>
            Upload the work order and construction map PDFs. Map pages are rendered at <strong>4× resolution</strong> and
            tiled into <strong>8 high-detail sections</strong> so the AI can read footage numbers and handhole labels accurately.
          </p>
          <p style={{ color: accent, margin: '0 0 20px', fontSize: '0.8rem' }}>
            <Eye size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            High-res tiled Vision AI — reads scanned maps, engineering drawings, and small text
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
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <AlertCircle size={20} color={errorRed} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: errorRed, whiteSpace: 'pre-wrap' }}>{error}</span>
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
              marginBottom: '16px',
            }}
          >
            {processing ? (
              <>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                {progressMsg || 'Processing...'}
              </>
            ) : (
              <>
                <Eye size={20} />
                Extract Project Data (High-Res Tiled Vision AI)
              </>
            )}
          </button>
        )}

        {/* Progress indicator */}
        {processing && progressMsg && (
          <div style={{
            backgroundColor: darkMode ? '#0a1628' : '#eff6ff',
            border: `1px solid ${accent}40`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            <p style={{ color: accent, margin: 0, fontSize: '0.9rem' }}>
              <Loader size={14} style={{ verticalAlign: 'middle', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              {progressMsg}
            </p>
          </div>
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

            {importResult._usage && (
              <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0 0 16px' }}>
                AI tokens: {importResult._usage.input_tokens?.toLocaleString()} in / {importResult._usage.output_tokens?.toLocaleString()} out
              </p>
            )}

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
                  ['Total Value', `$${(importResult.project.total_value || 0).toLocaleString()}`],
                  ['Start Date', importResult.project.start_date],
                  ['Completion Date', importResult.project.completion_date],
                  ['Rate Card', importResult.project.rate_card_id],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ color: textMuted, fontSize: '0.8rem', margin: '0 0 2px' }}>{label}</p>
                    <p style={{ margin: 0, fontWeight: 500 }}>{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                ['Segments', importResult.stats.totalSegments, accent],
                ['Total Footage', `${(importResult.stats.totalFootage || 0).toLocaleString()} LF`, '#FFB800'],
                ['Splice Points', importResult.stats.totalSplicePoints, '#4CAF50'],
                ['Segments $', `$${(importResult.stats.segmentsTotal || 0).toLocaleString()}`, accent],
                ['Splicing $', `$${(importResult.stats.splicesTotal || 0).toLocaleString()}`, '#4CAF50'],
                ['Unallocated $', `$${(importResult.stats.unallocatedTotal || 0).toLocaleString()}`, '#FFB800'],
                ['Grand Total', `$${(importResult.stats.grandTotal || 0).toLocaleString()}`, successGreen],
                ['WO Total', `$${(importResult.stats.woTotal || 0).toLocaleString()}`, textMuted],
              ].map(([label, value, color]) => (
                <div key={label} style={{
                  backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  flex: '1',
                  minWidth: '120px',
                  textAlign: 'center',
                  border: `1px solid ${borderColor}`,
                }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, color, margin: '0 0 4px' }}>{value}</p>
                  <p style={{ color: textMuted, fontSize: '0.75rem', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Segments */}
            <div style={{
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              marginBottom: '16px',
            }}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'segments' ? null : 'segments')}
                style={{
                  width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                  color: text, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: '1rem', fontWeight: 600,
                }}
              >
                Segments ({importResult.segments.length})
                {expandedSection === 'segments' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'segments' && (
                <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                  {importResult.segments.length === 0 ? (
                    <p style={{ color: textMuted, fontStyle: 'italic' }}>No segments extracted.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          {['ID', 'Section', 'From', 'To', 'Footage', 'Street', 'Value'].map(h => (
                            <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.segments.map((seg, i) => (
                          <tr key={seg.segment_id || i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{seg.contractor_id}</td>
                            <td style={{ padding: '8px' }}>{seg.section}</td>
                            <td style={{ padding: '8px' }}>{seg.from_handhole}</td>
                            <td style={{ padding: '8px' }}>{seg.to_handhole}</td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{seg.footage} LF</td>
                            <td style={{ padding: '8px' }}>{seg.street}</td>
                            <td style={{ padding: '8px', color: successGreen }}>${(seg.total_value || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Splice Points */}
            <div style={{
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              marginBottom: '16px',
            }}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'splices' ? null : 'splices')}
                style={{
                  width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                  color: text, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: '1rem', fontWeight: 600,
                }}
              >
                Splice Points ({importResult.splice_points.length}) — ${(importResult.stats.splicesTotal || 0).toLocaleString()}
                {expandedSection === 'splices' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'splices' && (
                <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                  {importResult.splice_points.length === 0 ? (
                    <p style={{ color: textMuted, fontStyle: 'italic' }}>No splice points extracted.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          {['Location', 'Handhole', 'Type', 'Position', 'Fibers', 'Value'].map(h => (
                            <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.splice_points.map((sp, i) => (
                          <tr key={sp.splice_id || i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{sp.location}</td>
                            <td style={{ padding: '8px' }}>{sp.handhole_type}</td>
                            <td style={{ padding: '8px' }}>{sp.splice_type}</td>
                            <td style={{ padding: '8px' }}>{sp.position_type}</td>
                            <td style={{ padding: '8px' }}>{sp.fiber_count}</td>
                            <td style={{ padding: '8px', color: successGreen, fontWeight: 600 }}>${(sp.total_value || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Work Order Line Items */}
            <div style={{
              backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              marginBottom: '16px',
            }}>
              <button
                onClick={() => setExpandedSection(expandedSection === 'wolines' ? null : 'wolines')}
                style={{
                  width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                  color: text, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: '1rem', fontWeight: 600,
                }}
              >
                WO Line Items ({(importResult.work_order_line_items || []).length})
                {expandedSection === 'wolines' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'wolines' && (
                <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                  {(importResult.work_order_line_items || []).length === 0 ? (
                    <p style={{ color: textMuted, fontStyle: 'italic' }}>No work order line items extracted.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          {['Code', 'Description', 'Qty', 'UOM', 'Rate', 'Total'].map(h => (
                            <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(importResult.work_order_line_items || []).map((li, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600 }}>{li.code}</td>
                            <td style={{ padding: '8px' }}>{li.description}</td>
                            <td style={{ padding: '8px' }}>{(li.qty || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>{li.uom}</td>
                            <td style={{ padding: '8px' }}>${(li.rate || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px', color: successGreen }}>${(li.total || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Unallocated Items */}
            {(importResult.unallocated_items || []).length > 0 && (
              <div style={{
                backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                marginBottom: '24px',
              }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'unallocated' ? null : 'unallocated')}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                    color: text, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: '1rem', fontWeight: 600,
                  }}
                >
                  Unallocated Items ({(importResult.unallocated_items || []).length}) — ${(importResult.stats.unallocatedTotal || 0).toLocaleString()}
                  {expandedSection === 'unallocated' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSection === 'unallocated' && (
                  <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          {['Code', 'Description', 'Qty', 'UOM', 'Rate', 'Total'].map(h => (
                            <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(importResult.unallocated_items || []).map((ui, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600 }}>{ui.code}</td>
                            <td style={{ padding: '8px' }}>{ui.description}</td>
                            <td style={{ padding: '8px' }}>{(ui.qty || 0).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>{ui.uom}</td>
                            <td style={{ padding: '8px' }}>${(ui.rate || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px', color: '#FFB800' }}>${(ui.total || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Confirm / Cancel */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleConfirmImport}
                disabled={processing}
                style={{
                  backgroundColor: successGreen, color: '#ffffff', border: 'none',
                  padding: '14px 32px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600,
                  cursor: processing ? 'not-allowed' : 'pointer', flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
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
                  backgroundColor: 'transparent', color: errorRed, border: `1px solid ${errorRed}`,
                  padding: '14px 24px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ position: 'fixed', bottom: '4px', right: '8px', fontSize: '0.6rem', color: 'transparent', userSelect: 'none' }}
        onDoubleClick={(e) => { e.target.style.color = textMuted; }}
      >
        JobImportPage v4.1.0
      </div>
    </div>
  );
}

export default JobImportPage;
