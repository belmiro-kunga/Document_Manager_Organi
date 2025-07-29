// Structured logging utilities for Advanced DMS
// Utilitários de logging estruturado para o DMS Avançado

import * as fs from 'fs';
import * as path from 'path';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

/**
 * Log level names
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.TRACE]: 'TRACE'
};

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  service?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  service: string;
  environment: string;
  format: 'json' | 'text';
  outputs: LogOutput[];
  enableColors: boolean;
  enableTimestamp: boolean;
  enableStackTrace: boolean;
  maxFileSize: number;
  maxFiles: number;
  datePattern: string;
}

/**
 * Log output interface
 */
export interface LogOutput {
  type: 'console' | 'file' | 'http' | 'elasticsearch';
  level?: LogLevel;
  config?: Record<string, any>;
}

/**
 * Console colors for different log levels
 */
const COLORS = {
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.INFO]: '\x1b[36m',  // Cyan
  [LogLevel.DEBUG]: '\x1b[35m', // Magenta
  [LogLevel.TRACE]: '\x1b[37m', // White
  RESET: '\x1b[0m'
};

/**
 * Main logger class
 */
export class Logger {
  private config: LoggerConfig;
  private outputs: LogOutputHandler[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      service: 'adms',
      environment: process.env.NODE_ENV || 'development',
      format: 'json',
      outputs: [{ type: 'console' }],
      enableColors: true,
      enableTimestamp: true,
      enableStackTrace: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      datePattern: 'YYYY-MM-DD',
      ...config
    };

    this.initializeOutputs();
  }

  /**
   * Log error message
   */
  public error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log trace message
   */
  public trace(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, metadata);
  }

  /**
   * Log HTTP request
   */
  public logRequest(req: any, res: any, duration: number): void {
    const metadata = {
      method: req.method,
      path: req.path || req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.id || req.headers['x-request-id'],
      userId: req.user?.id,
      userAgent: req.get?.('User-Agent'),
      ip: req.ip || req.connection?.remoteAddress,
      query: req.query,
      contentLength: res.get?.('Content-Length')
    };

    const level = res.statusCode >= 500 ? LogLevel.ERROR :
                 res.statusCode >= 400 ? LogLevel.WARN :
                 LogLevel.INFO;

    this.log(level, `${req.method} ${req.path || req.url} ${res.statusCode} - ${duration}ms`, metadata);
  }

  /**
   * Log database query
   */
  public logQuery(query: string, duration: number, metadata?: Record<string, any>): void {
    this.debug('Database query executed', {
      query: query.replace(/\s+/g, ' ').trim(),
      duration,
      ...metadata
    });
  }

  /**
   * Log external API call
   */
  public logExternalCall(service: string, method: string, url: string, statusCode: number, duration: number, metadata?: Record<string, any>): void {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                 statusCode >= 400 ? LogLevel.WARN :
                 LogLevel.INFO;

    this.log(level, `External API call to ${service}`, {
      service,
      method,
      url,
      statusCode,
      duration,
      ...metadata
    });
  }

  /**
   * Create child logger with additional context
   */
  public child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.outputs = this.outputs;
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, metadata?: Record<string, any>) => {
      originalLog(level, message, { ...context, ...metadata });
    };

    return childLogger;
  }

  /**
   * Set log level
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  public getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Check if level is enabled
   */
  public isLevelEnabled(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      service: this.config.service,
      ...metadata
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR && this.config.enableStackTrace && metadata?.error) {
      entry.error = {
        name: metadata.error.name || 'Error',
        message: metadata.error.message || message,
        stack: metadata.error.stack,
        code: metadata.error.code
      };
    }

    // Send to all outputs
    this.outputs.forEach(output => {
      try {
        output.write(entry);
      } catch (error) {
        console.error('Error writing to log output:', error);
      }
    });
  }

  /**
   * Initialize log outputs
   */
  private initializeOutputs(): void {
    this.outputs = this.config.outputs.map(outputConfig => {
      switch (outputConfig.type) {
        case 'console':
          return new ConsoleOutput(this.config, outputConfig);
        case 'file':
          return new FileOutput(this.config, outputConfig);
        case 'http':
          return new HttpOutput(this.config, outputConfig);
        case 'elasticsearch':
          return new ElasticsearchOutput(this.config, outputConfig);
        default:
          throw new Error(`Unknown log output type: ${outputConfig.type}`);
      }
    });
  }
}

/**
 * Base log output handler
 */
abstract class LogOutputHandler {
  protected config: LoggerConfig;
  protected outputConfig: LogOutput;

  constructor(config: LoggerConfig, outputConfig: LogOutput) {
    this.config = config;
    this.outputConfig = outputConfig;
  }

  abstract write(entry: LogEntry): void;

  protected shouldWrite(entry: LogEntry): boolean {
    const outputLevel = this.outputConfig.level ?? this.config.level;
    return entry.level <= outputLevel;
  }

  protected formatEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const timestamp = this.config.enableTimestamp ? `[${entry.timestamp}] ` : '';
    const level = entry.levelName.padEnd(5);
    const service = entry.service ? `[${entry.service}] ` : '';
    
    let formatted = `${timestamp}${level} ${service}${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += ` ${JSON.stringify(entry.metadata)}`;
    }

    return formatted;
  }
}

/**
 * Console output handler
 */
class ConsoleOutput extends LogOutputHandler {
  write(entry: LogEntry): void {
    if (!this.shouldWrite(entry)) {
      return;
    }

    const formatted = this.formatEntry(entry);
    const color = this.config.enableColors ? COLORS[entry.level] : '';
    const reset = this.config.enableColors ? COLORS.RESET : '';

    if (entry.level <= LogLevel.WARN) {
      console.error(`${color}${formatted}${reset}`);
    } else {
      console.log(`${color}${formatted}${reset}`);
    }
  }
}

/**
 * File output handler
 */
class FileOutput extends LogOutputHandler {
  private filePath: string;
  private currentDate: string;

  constructor(config: LoggerConfig, outputConfig: LogOutput) {
    super(config, outputConfig);
    
    const logDir = outputConfig.config?.directory || './logs';
    const filename = outputConfig.config?.filename || 'app.log';
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.currentDate = new Date().toISOString().split('T')[0];
    this.filePath = path.join(logDir, `${this.currentDate}-${filename}`);
  }

  write(entry: LogEntry): void {
    if (!this.shouldWrite(entry)) {
      return;
    }

    const formatted = this.formatEntry(entry) + '\n';
    
    try {
      // Rotate file if date changed
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== this.currentDate) {
        this.currentDate = currentDate;
        const logDir = path.dirname(this.filePath);
        const filename = path.basename(this.filePath).split('-').slice(1).join('-');
        this.filePath = path.join(logDir, `${currentDate}-${filename}`);
      }

      fs.appendFileSync(this.filePath, formatted);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

/**
 * HTTP output handler (for centralized logging)
 */
class HttpOutput extends LogOutputHandler {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(config: LoggerConfig, outputConfig: LogOutput) {
    super(config, outputConfig);
    
    this.endpoint = outputConfig.config?.endpoint || 'http://localhost:3000/logs';
    this.headers = {
      'Content-Type': 'application/json',
      ...outputConfig.config?.headers
    };
  }

  write(entry: LogEntry): void {
    if (!this.shouldWrite(entry)) {
      return;
    }

    // In a real implementation, this would use fetch or axios
    // For now, just log that it would be sent
    console.log(`Would send to ${this.endpoint}:`, entry);
  }
}

/**
 * Elasticsearch output handler
 */
class ElasticsearchOutput extends LogOutputHandler {
  private client: any;
  private index: string;

  constructor(config: LoggerConfig, outputConfig: LogOutput) {
    super(config, outputConfig);
    
    this.index = outputConfig.config?.index || 'adms-logs';
    
    // In a real implementation, this would initialize Elasticsearch client
    console.log('Elasticsearch output initialized for index:', this.index);
  }

  write(entry: LogEntry): void {
    if (!this.shouldWrite(entry)) {
      return;
    }

    // In a real implementation, this would index to Elasticsearch
    console.log(`Would index to Elasticsearch (${this.index}):`, entry);
  }
}

/**
 * Create logger instance with default configuration
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

/**
 * Create logger for Docker container environment
 */
export function createDockerLogger(service: string): Logger {
  return new Logger({
    service,
    format: 'json',
    enableColors: false,
    outputs: [
      { type: 'console' },
      { 
        type: 'file', 
        config: { 
          directory: '/app/logs',
          filename: `${service}.log`
        }
      }
    ]
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger({
  service: 'adms',
  level: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
  format: process.env.NODE_ENV === 'production' ? 'json' : 'text'
});