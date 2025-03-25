const logger = require('./logger');
module.exports.logError = (src, err) => logger.error(`[${src}] ${err.stack || err}`);
