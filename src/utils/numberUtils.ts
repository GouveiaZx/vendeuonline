/**
 * Safe numeric utility functions to prevent toFixed errors
 */

/**
 * Safely converts a value to a fixed decimal string
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with fallback to "0.00"
 */
export const safeToFixed = (value: any, decimals: number = 2): string => {
  const numValue = Number(value);
  if (isNaN(numValue) || !isFinite(numValue)) {
    return '0.' + '0'.repeat(decimals);
  }
  return numValue.toFixed(decimals);
};

/**
 * Safely formats currency values
 * @param value - The value to format as currency
 * @param currency - Currency symbol (default: 'R$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: any, currency: string = 'R$', decimals: number = 2): string => {
  return `${currency} ${safeToFixed(value, decimals)}`;
};

/**
 * Safely formats percentage values
 * @param value - The value to format as percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: any, decimals: number = 1): string => {
  return `${safeToFixed(value, decimals)}%`;
};

/**
 * Safely formats rating values
 * @param rating - The rating value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted rating string
 */
export const formatRating = (rating: any, decimals: number = 1): string => {
  return safeToFixed(rating, decimals);
};

/**
 * Safely converts any value to a number with fallback
 * @param value - The value to convert
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Safe numeric value
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const numValue = Number(value);
  return isNaN(numValue) || !isFinite(numValue) ? fallback : numValue;
};

/**
 * Safely formats file sizes
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: any, decimals: number = 2): string => {
  const safeBytes = safeNumber(bytes, 0);
  if (safeBytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(safeBytes) / Math.log(k));
  
  return `${safeToFixed(safeBytes / Math.pow(k, i), decimals)} ${sizes[i]}`;
};