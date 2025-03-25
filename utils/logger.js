const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFormat = format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`);

const logger = createLogger({
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), logFormat),
        }),
        new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
        new transports.File({ filename: path.join(__dirname, '../logs/all.log') }),
    ],
    exceptionHandlers: [
        new transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') }),
    ],
    rejectionHandlers: [
        new transports.File({ filename: path.join(__dirname, '../logs/rejections.log') }),
    ],
});

module.exports = logger;
