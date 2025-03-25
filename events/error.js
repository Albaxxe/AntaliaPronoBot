const { logError } = require('../utils/errorHandler');
module.exports = { name: 'error', execute(error){ logError('DiscordClient', error); }};
