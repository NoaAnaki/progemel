/**
 * ProGemel — Data Loader
 * Loads all fund data and provides helpers for lookup
 */
import rawData from '../data/raw_data.json';

export const PRODUCT_LABELS = {
  'השתלמות':     { label: 'קרנות השתלמות',      icon: '🎓', color: '#8B1A3A' },
  'פוליסות':     { label: 'פוליסות חיסכון',      icon: '📋', color: '#A0233F' },
  'פנסיה':       { label: 'קרנות פנסיה',         icon: '🔐', color: '#6B1230' },
  'גמל':         { label: 'קופות גמל',            icon: '💰', color: '#C03050' },
  'גמל_להשקעה':  { label: 'גמל להשקעה',          icon: '📈', color: '#D4445A' },
};

/**
 * Get flat array of all funds for a product
 */
export function getAllFunds(productKey) {
  const productData = rawData[productKey];
  if (!productData) return [];
  return Object.values(productData).flat();
}

/**
 * Get funds for a specific sheet
 */
export function getFundsBySheet(productKey, sheetName) {
  return rawData[productKey]?.[sheetName] ?? [];
}

/**
 * Get all available sheet names for a product
 */
export function getSheets(productKey) {
  return Object.keys(rawData[productKey] ?? {});
}

/**
 * Calculate average values across an array of funds
 */
export function calcAverages(funds) {
  const keys = ['ret_month', 'ret_ytd', 'ret_1y', 'ret_3y', 'ret_5y', 'stocks', 'foreign', 'forex', 'illiquid', 'fees', 'profit_index'];
  const result = { name: 'ממוצע', isAverage: true };
  keys.forEach(k => {
    const vals = funds.map(f => f[k]).filter(v => v !== null && v !== undefined);
    result[k] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
  });
  return result;
}

/**
 * Sort funds by profit_index desc (nulls last), then ret_1y desc
 */
export function sortFunds(funds) {
  return [...funds].sort((a, b) => {
    const ai = a.profit_index ?? -Infinity;
    const bi = b.profit_index ?? -Infinity;
    if (bi !== ai) return bi - ai;
    return (b.ret_1y ?? -Infinity) - (a.ret_1y ?? -Infinity);
  });
}

export { rawData };
