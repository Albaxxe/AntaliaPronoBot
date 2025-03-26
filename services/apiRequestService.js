// services/apiRequestsService.js
const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

// (Optionnel) si tu utilises un rate-limiter comme Bottleneck
// const Bottleneck = require('bottleneck');
// const limiter = new Bottleneck({
//   reservoir: 100,
//   reservoirRefreshAmount: 100,
//   reservoirRefreshInterval: 60 * 1000,
//   minTime: 600
// });

/**
 * Effectue une requête GET sur l'URL spécifiée et retourne les données JSON.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchData(url) {
  try {
    logger.info(`fetchData -> GET ${url}`);
    // Si tu utilises un rate-limiter :
    // const response = await limiter.schedule(() => axios.get(url));
    const response = await axios.get(url);
    logger.info(`fetchData -> Réponse OK pour ${url} (status=${response.status})`);
    return response.data;
  } catch (error) {
    logger.error(`fetchData -> Erreur pour ${url}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  fetchData
};
