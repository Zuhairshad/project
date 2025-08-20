// src/utils/format.jsx

/**
 * Format a JavaScript Date object into a readable string.
 * Example: Jan 20, 2025
 */
export function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Format a number with commas.
 * Example: 1000000 -> "1,000,000"
 */
export function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a percentage with one decimal place.
 * Example: 0.256 -> "25.6%"
 */
export function formatPercent(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}
