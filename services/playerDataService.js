// services/playerDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStorePlayersForTeam(teamName) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStorePlayersForTeam -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?t=${encodeURIComponent(teamName)}`;
    logger.info(`fetchAndStorePlayersForTeam -> Récupération des joueurs pour l'équipe ${teamName}`);
    const data = await fetchData(url);
    if (data && data.player && data.player.length > 0) {
      for (const player of data.player) {
        const query = `
          INSERT INTO players (id_player, strplayer, strthumb, strnationality)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_player) DO UPDATE
            SET strplayer = EXCLUDED.strplayer,
                strthumb = EXCLUDED.strthumb,
                strnationality = EXCLUDED.strnationality,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const values = [player.idPlayer, player.strPlayer, player.strThumb, player.strNationality];
        await db.query(query, values);
      }
      logger.info(`fetchAndStorePlayersForTeam -> ${data.player.length} joueurs pour ${teamName} mis à jour en BDD.`);
    } else {
      logger.warn(`fetchAndStorePlayersForTeam -> Aucun joueur trouvé pour ${teamName}`);
    }
  } catch (error) {
    logger.error(`fetchAndStorePlayersForTeam -> Erreur pour ${teamName}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStorePlayersForTeam };
