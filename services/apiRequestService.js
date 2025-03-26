// src/services/apiRequestsService.js
const axios = require('axios');
const limiter = require('./apiRateLimiter');
require('dotenv').config();

// Petit cache mémoire pour éviter de redemander la même donnée
// => Map<cacheKey, { data, expires }>
const memoryCache = new Map();
// Durée de cache par défaut, ex: 1 minute (en ms)
const DEFAULT_TTL = 60 * 1000;

/**
 * Récupère des données depuis une URL, avec rate-limiting et cache.
 * @param {string} url - L'URL à appeler
 * @param {number} [ttl=DEFAULT_TTL] - Durée de cache en ms
 * @returns {Promise<any>} La réponse JSON
 */
async function fetchWithRateLimit(url, ttl = DEFAULT_TTL) {
  // 1) Vérifier le cache
  const now = Date.now();
  const cached = memoryCache.get(url);
  if (cached && cached.expires > now) {
    // console.log(`♻️ Cache hit pour ${url}`);
    return cached.data;
  }

  // 2) Pas de cache valide => on fait un appel HTTP via le limiter
  try {
    const response = await limiter.schedule(() => axios.get(url));
    const data = response.data;

    // 3) Mettre en cache
    memoryCache.set(url, { 
      data, 
      expires: now + ttl 
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Erreur fetchWithRateLimit(${url}):`, error.message);
    throw error;
  }
}

module.exports = {
  fetchWithRateLimit
};
