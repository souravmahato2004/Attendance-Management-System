// This file now contains only constants that are not managed by contexts
// Most data is now managed by AppContext, ConfigContext, and AuthContext

// API configuration constants
export const API_TIMEOUT = 10000; // 10 seconds
export const MAX_RETRY_ATTEMPTS = 3;

// UI constants
export const TOAST_DURATION = 5000; // 5 seconds
export const DEBOUNCE_DELAY = 300; // 300ms

// File upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// Pagination constants
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Date format constants
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  ISO: 'YYYY-MM-DD',
  READABLE: 'MMM DD, YYYY'
};

// Validation constants
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 100,
  MIN_NAME_LENGTH: 2
};

// Status constants for UI states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
};