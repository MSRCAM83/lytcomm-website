import React, { useRef, useState, useEffect } from 'react';
import { colors } from '../config/constants';

const SignaturePad = ({ onSignatureChange, label = 'Signature', required = true, darkMode = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Label color based on theme
  const labelColor = darkMode ? '#e5e7eb' : colors.dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      // TRANSPARENT background - just clear the canvas, don't fill with white
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasSignature(true);
      const canvas = canvasRef.current;
      // PNG format preserves transparency
      const dataUrl = canvas.toDataURL('image/png');
      if (onSignatureChange) {
        onSignatureChange(dataUrl);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // TRANSPARENT clear - not white fill
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: labelColor }}>
        {label} {required && <span style={{ color: colors.coral }}>*</span>}
      </label>
      <div
        style={{
          border: `2px solid ${hasSignature ? colors.green : (darkMode ? '#4b5563' : '#ddd')}`,
          borderRadius: '8px',
          overflow: 'hidden',
          // White background on the container for visibility while drawing
          // but canvas itself is transparent
          backgroundColor: '#fff',
        }}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          style={{
            width: '100%',
            height: '150px',
            cursor: 'crosshair',
            touchAction: 'none',
            // Canvas appears white due to container background
            // but actual canvas data is transparent
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : colors.gray }}>
          {hasSignature ? '✓ Signature captured' : 'Draw your signature above'}
        </span>
        <button
          type="button"
          onClick={clearSignature}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: darkMode ? '#374151' : '#f3f4f6',
            border: `1px solid ${darkMode ? '#4b5563' : '#ddd'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            color: darkMode ? '#e5e7eb' : '#374151',
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
