import React, { useState } from 'react';
import { colors } from '../config/constants';

const SSNInput = ({ value, onChange, label = 'Social Security Number', required = true, showFull = false }) => {
  const [focused, setFocused] = useState(false);

  const formatSSN = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleChange = (e) => {
    const formatted = formatSSN(e.target.value);
    onChange(formatted);
  };

  const displayValue = () => {
    if (!value) return '';
    if (showFull || focused) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 9) return value;
    return `***-**-${digits.slice(5)}`;
  };

  const isComplete = value && value.replace(/\D/g, '').length === 9;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: colors.dark }}>
        {label} {required && <span style={{ color: colors.coral }}>*</span>}
      </label>
      <input
        type="text"
        value={displayValue()}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="XXX-XX-XXXX"
        maxLength={11}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          border: `2px solid ${isComplete ? colors.green : '#ddd'}`,
          borderRadius: '8px',
          outline: 'none',
          fontFamily: 'monospace',
          letterSpacing: '2px',
          boxSizing: 'border-box',
        }}
      />
      {isComplete && (
        <span style={{ fontSize: '12px', color: colors.green, marginTop: '4px', display: 'block' }}>
          ✓ SSN complete
        </span>
      )}
    </div>
  );
};

export default SSNInput;
