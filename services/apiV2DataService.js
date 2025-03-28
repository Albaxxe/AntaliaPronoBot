// services/apiV2DataService.js
const config = require('../config');
const axios = require('axios');
const logger = require('../utils/logger');
const { authenticateV2 } = require('./apiV2Auth');
require('dotenv').config();

async function fetchDataV2(endpoint) {
  try {
    const token = await authenticateV2();
    if (!token) throw new Error('Token API V2 introuvable.');
    const url = `https://www.thesportsdb.com/api/v2/json/${token}/${endpoint}`;
    logger.info(`fetchDataV2 -> GET ${url}`);
    const response = await axios.get(url);
    logger.info(`fetchDataV2 -> Réponse OK pour ${url} (status=${response.status})`);
    return response.data;
  } catch (error) {
    logger.error(`fetchDataV2 -> Erreur: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchDataV2 };
