// services/teamDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreAllTeamsForLeague(leagueId) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStoreAllTeamsForLeague -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_teams.php?id=${leagueId}`;
    logger.info(`fetchAndStoreAllTeamsForLeague -> Récupération de toutes les équipes pour la ligue ID ${leagueId}`);
    const data = await fetchData(url);
    if (data && data.teams && data.teams.length > 0) {
      for (const team of data.teams) {
        const query = `
          INSERT INTO teams (id_team, name, country, logo_url, description, founded, stadium, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id_team) DO UPDATE
            SET name = EXCLUDED.name,
                country = EXCLUDED.country,
                logo_url = EXCLUDED.logo_url,
                description = EXCLUDED.description,
                founded = EXCLUDED.founded,
                stadium = EXCLUDED.stadium,
                updated_at = CURRENT_TIMESTAMP;
        `;
        // Exemple : mapping des données de l'API (vérifiez les noms exacts dans la réponse API)
        const values = [
          team.idTeam,
          team.strTeam,
          team.strCountry,
          team.strTeamBadge,
          team.strDescriptionEN,
          team.intFormedYear,
          team.strStadium
        ];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreAllTeamsForLeague -> ${data.teams.length} équipes mises à jour en BDD pour la ligue ${leagueId}.`);
    } else {
      logger.warn(`fetchAndStoreAllTeamsForLeague -> Aucune équipe trouvée pour la ligue ID ${leagueId}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreAllTeamsForLeague -> Erreur pour la ligue ID ${leagueId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreAllTeamsForLeague };
