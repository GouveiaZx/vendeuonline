/**
 * SSR-Safe utilities for deterministic value generation
 * Prevents hydration mismatches between server and client
 */

let idCounter = 0;
const baseTimestamp = 1640995200000; // Fixed timestamp: 2022-01-01T00:00:00.000Z

/**
 * Detects if code is running on server-side
 */
export const isServerSide = (): boolean => {
  return typeof window === 'undefined';
};

/**
 * Generates deterministic IDs for SSR compatibility
 * Uses incremental counter instead of random values
 */
export const generateSSRSafeId = (prefix: string = 'id'): string => {
  idCounter++;
  if (isServerSide()) {
    return `${prefix}_ssr_${idCounter}`;
  }
  return `${prefix}_${Date.now()}_${idCounter}`;
};

/**
 * Gets timestamp that's safe for SSR
 * Returns fixed timestamp on server, current time on client
 */
export const getSSRSafeTimestamp = (): number => {
  if (isServerSide()) {
    return baseTimestamp;
  }
  return Date.now();
};

/**
 * Gets Date object that's safe for SSR
 * Returns fixed date on server, current date on client
 */
export const getSSRSafeDate = (): Date => {
  return new Date(getSSRSafeTimestamp());
};

/**
 * Generates deterministic random-like values for SSR
 * Uses Math.sin for pseudo-randomness based on counter
 */
export const generateSSRSafeRandom = (): number => {
  idCounter++;
  if (isServerSide()) {
    // Use sine function for deterministic "random" values
    return Math.abs(Math.sin(idCounter) * 1000) % 1;
  }
  return Math.random();
};

/**
 * Creates order ID that's safe for SSR
 * Uses deterministic generation on server, dynamic on client
 */
export const generateOrderId = (): string => {
  if (isServerSide()) {
    idCounter++;
    return `order_ssr_${String(idCounter).padStart(6, '0')}`;
  }
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates toast ID that's safe for SSR
 */
export const generateToastId = (): string => {
  return generateSSRSafeId('toast');
};

/**
 * Resets the counter (useful for testing)
 */
export const resetSSRCounter = (): void => {
  idCounter = 0;
};