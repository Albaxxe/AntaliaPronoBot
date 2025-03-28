// services/apiV2Auth.js
const config = require('../config');
const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

async function authenticateV2() {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB_V2; // Par exemple, une clé pour V2
    if (!apiKey) {
      logger.error('API_KEY_THE_SPORTS_DB_V2 non défini.');
      return null;
    }
    // Exemple d'endpoint d'authentification (vérifiez la doc de l'API V2)
    const url = `https://www.thesportsdb.com/api/v2/login`;
    const payload = {
      apiKey,  // ou autre paramètre selon la documentation
      username: process.env.API_V2_USERNAME,
      password: process.env.API_V2_PASSWORD
    };
    logger.info('Authentification sur l\'API V2 en cours...');
    const response = await axios.post(url, payload);
    if (response.data && response.data.token) {
      logger.info('Authentification API V2 réussie.');
      return response.data.token; // On retourne le token pour les requêtes ultérieures
    } else {
      logger.error('Authentification API V2 échouée, pas de token reçu.');
      return null;
    }
  } catch (error) {
    logger.error(`Erreur d'authentification API V2: ${error.message}`);
    throw error;
  }
}

module.exports = { authenticateV2 };
