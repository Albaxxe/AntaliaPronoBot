// services/apiRequestsService.js
const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchData(url) {
  try {
    logger.info(`fetchData -> GET ${url}`);
    const response = await axios.get(url);
    logger.info(`fetchData -> Réponse OK pour ${url} (status=${response.status})`);
    return response.data;
  } catch (error) {
    logger.error(`fetchData -> Erreur pour ${url}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchData };
