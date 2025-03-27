// services/teamDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreAllTeams(sport) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStoreAllTeams -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    // Endpoint pour récupérer toutes les équipes pour un sport donné
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?s=${encodeURIComponent(sport)}`;
    logger.info(`fetchAndStoreAllTeams -> Récupération de toutes les équipes pour le sport ${sport}`);
    const data = await fetchData(url);
    if (data && data.teams && data.teams.length > 0) {
      for (const team of data.teams) {
        // Mappe les clés de l'API aux colonnes de la table teams
        // Exemple : team.idTeam -> id_team, team.strTeam -> name, team.strCountry -> country, team.strTeamBadge -> logo_url
        const query = `
          INSERT INTO teams (id_team, name, country, logo_url, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (id_team) DO UPDATE
            SET name = EXCLUDED.name,
                country = EXCLUDED.country,
                logo_url = EXCLUDED.logo_url,
                created_at = CURRENT_TIMESTAMP;
        `;
        const values = [team.idTeam, team.strTeam, team.strCountry, team.strTeamBadge];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreAllTeams -> ${data.teams.length} équipes mises à jour en BDD pour ${sport}.`);
    } else {
      logger.warn(`fetchAndStoreAllTeams -> Aucune équipe trouvée pour ${sport}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreAllTeams -> Erreur pour ${sport}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreAllTeams };
