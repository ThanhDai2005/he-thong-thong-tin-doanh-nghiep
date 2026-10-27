import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  }),
);

// Format for file output (JSON structured logging)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Daily rotate file transport for error logs
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../logs/error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "20m",
  maxFiles: "14d", // Keep logs for 14 days
  format: fileFormat,
});

// Daily rotate file transport for combined logs
const combinedFileRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../logs/combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d", // Keep logs for 14 days
  format: fileFormat,
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: fileFormat,
  transports: [errorFileRotateTransport, combinedFileRotateTransport],
  // Gọi hàm không tồn tại, biến chưa định nghĩa mà không nằm trong try/catch (uncaught exception) → lỗi nhảy vào file exceptionHandlers
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, "../logs/exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
    }),
  ],

  // Lỗi gọi API/Database thất bại nhưng thiếu .catch() hoặc thiếu try/catch trong hàm async → nhảy vào file rejectionHandlers
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, "../logs/rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
    }),
  ],
});

// Add console transport for development/production
logger.add(
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? fileFormat : consoleFormat,
  }),
);

// Helper methods for common logging patterns
logger.logError = (message, error, context = {}) => {
  logger.error({
    message,
    error: {
      message: error?.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

logger.logInfo = (message, context = {}) => {
  logger.info({
    message,
    ...context,
  });
};

logger.logWarning = (message, context = {}) => {
  logger.warn({
    message,
    ...context,
  });
};

logger.logDebug = (message, context = {}) => {
  logger.debug({
    message,
    ...context,
  });
};

export default logger;
