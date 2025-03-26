// services/apiRequestsService.js
const axios = require('axios');

/**
 * Effectue une requête GET sur l'URL spécifiée et retourne les données.
 * @param {string} url - L'URL de la requête.
 * @returns {Promise<any>} Les données de la réponse.
 */
async function fetchData(url) {
  const response = await axios.get(url);
  return response.data;
}

module.exports = { fetchData };