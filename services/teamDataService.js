// services/teamDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreTeamInfo(teamName) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStoreTeamInfo -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    logger.info(`fetchAndStoreTeamInfo -> Récupération des infos pour l'équipe ${teamName}`);
    const data = await fetchData(url);
    if (data && data.teams && data.teams.length > 0) {
      const team = data.teams[0];
      logger.info(`fetchAndStoreTeamInfo -> Infos récupérées pour ${team.strTeam}`);
      const query = `
        INSERT INTO teams (id_team, strTeam, strTeamBadge, strDescriptionEN)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_team) DO UPDATE
          SET strTeam = EXCLUDED.strTeam,
              strTeamBadge = EXCLUDED.strTeamBadge,
              strDescriptionEN = EXCLUDED.strDescriptionEN,
              updated_at = CURRENT_TIMESTAMP;
      `;
      const values = [team.idTeam, team.strTeam, team.strTeamBadge, team.strDescriptionEN];
      await db.query(query, values);
      logger.info(`fetchAndStoreTeamInfo -> Infos de ${team.strTeam} mises à jour en BDD.`);
    } else {
      logger.warn(`fetchAndStoreTeamInfo -> Aucune info trouvée pour ${teamName}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreTeamInfo -> Erreur pour ${teamName}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreTeamInfo };
