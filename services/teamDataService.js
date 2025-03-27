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
    // Utiliser l'endpoint lookup_all_teams.php pour une ligue spécifique
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_teams.php?id=${leagueId}`;
    logger.info(`fetchAndStoreAllTeamsForLeague -> Récupération de toutes les équipes pour la ligue ID ${leagueId}`);
    const data = await fetchData(url);
    if (data && data.teams && data.teams.length > 0) {
      for (const team of data.teams) {
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
