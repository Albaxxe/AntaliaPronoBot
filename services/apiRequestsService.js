// services/apiRequestsService.js
const config = require('../config');
const axios = require('axios');
const Bottleneck = require('bottleneck');
const logger = require('../utils/logger');
require('dotenv').config();

// Configuration du rate limiter
const limiter = new Bottleneck({
  reservoir: 90, // Nombre de requêtes autorisées par minute
  reservoirRefreshAmount: 90,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  minTime: 1000 // 1 seconde entre chaque requête
});

// Nombre maximum de tentatives en cas d’erreur réseau
const MAX_RETRIES = 3;

async function fetchData(url, attempt = 1) {
  try {
    logger.info(`fetchData -> GET ${url} (attempt ${attempt})`);
    const response = await limiter.schedule(() => axios.get(url));
    logger.info(`fetchData -> Réponse OK pour ${url} (status=${response.status})`);
    return response.data;
  } catch (error) {
    // 1) Gérer les erreurs 429 ou réseau (ECONNRESET)
    if (
      (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') &&
      attempt < MAX_RETRIES
    ) {
      logger.warn(
        `fetchData -> Erreur réseau (${error.code}) pour ${url}. Tentative ${attempt}/${MAX_RETRIES}. Retrying...`
      );
      // Attendre un petit délai avant de retenter
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchData(url, attempt + 1);
    }
    // 2) Gérer aussi l'erreur 429 si vous voulez un retry
    if (
      error.response &&
      error.response.status === 429 &&
      attempt < MAX_RETRIES
    ) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      logger.warn(
        `Rate Limit atteint pour ${url}. Tentative ${attempt}/${MAX_RETRIES}. Retrying après ${retryAfter}s...`
      );
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return fetchData(url, attempt + 1);
    }

    // Si on ne peut pas gérer l’erreur ou plus de tentatives
    logger.error(`fetchData -> Erreur pour ${url}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchData };
