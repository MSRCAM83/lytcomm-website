import React, { useState } from 'react';
import { colors } from '../config/constants';

const EINInput = ({ value, onChange, label = 'Employer Identification Number (EIN)', required = true, darkMode = false }) => {
  const [focused, setFocused] = useState(false);

  const formatEIN = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  };

  const handleChange = (e) => {
    const formatted = formatEIN(e.target.value);
    onChange(formatted);
  };

  const displayValue = () => {
    if (!value) return '';
    if (focused) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 9) return value;
    return `${digits.slice(0, 2)}-***${digits.slice(6)}`;
  };

  const isComplete = value && value.replace(/\D/g, '').length === 9;

  // Always use white background with dark text for form inputs
  const labelColor = darkMode ? '#e5e7eb' : colors.dark;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: labelColor }}>
        {label} {required && <span style={{ color: colors.coral }}>*</span>}
      </label>
      <input
        type="text"
        value={displayValue()}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="XX-XXXXXXX"
        maxLength={10}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          border: `2px solid ${isComplete ? colors.green : (darkMode ? '#4b5563' : '#ddd')}`,
          borderRadius: '8px',
          outline: 'none',
          fontFamily: 'monospace',
          letterSpacing: '2px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#1f2937',
        }}
      />
      {isComplete && (
        <span style={{ fontSize: '12px', color: colors.green, marginTop: '4px', display: 'block' }}>
          ✓ EIN complete
        </span>
      )}
    </div>
  );
};

export default EINInput;
