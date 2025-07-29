// Shared utilities and types for Advanced Document Management System
// Sistema de Gestão Documental Avançado - Multilíngue (PT/EN/FR)

// Types and interfaces
export * from './types/common';

// Error handling
export * from './errors/base-error';
export * from './errors/error-handler';

// Logging
export * from './logging/logger';

// Utilities
export * from './utils/validation';
export * from './utils/helpers';

// Configuration
export * from './config/environment';

// Legacy exports (for backward compatibility)
export * from './types';
export * from './utils';
export * from './constants';
export * from './validation';
export * from './errors';