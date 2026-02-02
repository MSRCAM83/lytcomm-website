/**
 * LYT Communications - Rate Card Matcher & Billing Calculator
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Calculates billing amounts for segments and splice points
 * based on the active rate card. Handles all splice billing
 * scenarios including mid-span vs end-of-line.
 */

import { RATE_CARDS } from '../config/mapConfig';

/**
 * Get the active rate card for a customer
 * @param {string} rateCardId - Rate card identifier
 * @returns {object|null} Rate card object or null
 */
export function getRateCard(rateCardId) {
  return RATE_CARDS[rateCardId] || null;
}

/**
 * Look up a unit price from a rate card
 * @param {string} rateCardId - Rate card identifier
 * @param {string} unitCode - Unit code (UG1, FS1, etc.)
 * @returns {object|null} Rate info with price, uom, description
 */
export function getUnitRate(rateCardId, unitCode) {
  const card = RATE_CARDS[rateCardId];
  if (!card || !card.rates[unitCode]) return null;
  return { ...card.rates[unitCode], unitCode };
}

/**
 * Calculate boring segment billing
 * @param {number} footage - Linear feet of bore
 * @param {number} ductCount - Number of ducts (1-6)
 * @param {string} rateCardId - Rate card to use
 * @returns {object} Billing breakdown with line items and total
 */
export function calculateBoringBilling(footage, ductCount, rateCardId) {
  const items = [];
  let unitCode = 'UG1';
  
  if (ductCount >= 6) unitCode = 'UG24';
  else if (ductCount >= 5) unitCode = 'UG23';
  
  const rate = getUnitRate(rateCardId, unitCode);
  if (!rate) return { items: [], total: 0 };
  
  const lineTotal = footage * rate.price;
  items.push({
    unitCode,
    description: rate.description,
    quantity: footage,
    uom: rate.uom,
    unitPrice: rate.price,
    total: lineTotal,
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

/**
 * Calculate cable pulling billing
 * @param {number} footage - Linear feet of pull
 * @param {number} fiberCount - Fiber count (up to 144 or 288-432)
 * @param {string} rateCardId - Rate card to use
 * @returns {object} Billing breakdown
 */
export function calculatePullingBilling(footage, fiberCount, rateCardId) {
  const items = [];
  const unitCode = fiberCount > 144 ? 'UG28' : 'UG4';
  
  const rate = getUnitRate(rateCardId, unitCode);
  if (!rate) return { items: [], total: 0 };
  
  items.push({
    unitCode,
    description: rate.description,
    quantity: footage,
    uom: rate.uom,
    unitPrice: rate.price,
    total: footage * rate.price,
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

/**
 * Calculate splice point billing
 * @param {string} spliceType - Type: '1x4', '1x8', 'F1', 'TYCO-D'
 * @param {string} positionType - 'mid-span' or 'end-of-line'
 * @param {number} fiberCount - Number of fibers to splice
 * @param {number} testCount - Number of power meter tests (usually 8 per 1x4)
 * @param {string} rateCardId - Rate card to use
 * @returns {object} Billing breakdown
 */
export function calculateSpliceBilling(spliceType, positionType, fiberCount, testCount, rateCardId) {
  const items = [];

  // Case setup: mid-span = ring cut (FS2), end-of-line = reenter (FS4)
  if (positionType === 'mid-span') {
    const fs2 = getUnitRate(rateCardId, 'FS2');
    if (fs2) {
      items.push({
        unitCode: 'FS2',
        description: fs2.description,
        quantity: 1,
        uom: fs2.uom,
        unitPrice: fs2.price,
        total: fs2.price,
      });
    }
  } else {
    const fs4 = getUnitRate(rateCardId, 'FS4');
    if (fs4) {
      items.push({
        unitCode: 'FS4',
        description: fs4.description,
        quantity: 1,
        uom: fs4.uom,
        unitPrice: fs4.price,
        total: fs4.price,
      });
    }
  }

  // Fusion splices (FS1)
  if (fiberCount > 0) {
    const fs1 = getUnitRate(rateCardId, 'FS1');
    if (fs1) {
      items.push({
        unitCode: 'FS1',
        description: fs1.description,
        quantity: fiberCount,
        uom: fs1.uom,
        unitPrice: fs1.price,
        total: fiberCount * fs1.price,
      });
    }
  }

  // Test fibers (FS3)
  if (testCount > 0) {
    const fs3 = getUnitRate(rateCardId, 'FS3');
    if (fs3) {
      items.push({
        unitCode: 'FS3',
        description: fs3.description,
        quantity: testCount,
        uom: fs3.uom,
        unitPrice: fs3.price,
        total: testCount * fs3.price,
      });
    }
  }

  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

/**
 * Calculate handhole billing
 * @param {string} handholeType - Handhole dimensions (e.g., '17x30x18')
 * @param {boolean} includeGroundRod - Whether to add ground rod
 * @param {string} rateCardId - Rate card to use
 * @returns {object} Billing breakdown
 */
export function calculateHandholeBilling(handholeType, includeGroundRod, rateCardId) {
  const items = [];
  
  // Map handhole type to unit code
  const handholeUnitMap = {
    '15x20x12': 'UG20',
    '17x30x18': 'UG17',
    '24x36x18': 'UG18',
    '24x36x24': 'UG11',
    '30x48x18': 'UG19',
    '30x48x24': 'UG27',
    '30x48x30': 'UG10',
  };

  const unitCode = handholeUnitMap[handholeType];
  if (unitCode) {
    const rate = getUnitRate(rateCardId, unitCode);
    if (rate) {
      items.push({
        unitCode,
        description: rate.description,
        quantity: 1,
        uom: rate.uom,
        unitPrice: rate.price,
        total: rate.price,
      });
    }
  }

  if (includeGroundRod) {
    const rod = getUnitRate(rateCardId, 'UG13');
    if (rod) {
      items.push({
        unitCode: 'UG13',
        description: rod.description,
        quantity: 1,
        uom: rod.uom,
        unitPrice: rod.price,
        total: rod.price,
      });
    }
  }

  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

/**
 * Calculate full segment billing (boring + pulling + handhole)
 * @param {object} segment - Segment data object
 * @param {string} rateCardId - Rate card to use
 * @returns {object} Complete billing breakdown by phase
 */
export function calculateSegmentBilling(segment, rateCardId) {
  const boring = calculateBoringBilling(
    segment.footage || 0,
    segment.ductCount || 1,
    rateCardId
  );

  const pulling = calculatePullingBilling(
    segment.footage || 0,
    segment.fiberCount || 24,
    rateCardId
  );

  return {
    boring,
    pulling,
    grandTotal: boring.total + pulling.total,
  };
}

/**
 * Format currency for display
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted string like $1,234.56
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// v1.0.0
