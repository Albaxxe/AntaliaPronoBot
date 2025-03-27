// services/leagueDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreLeagues(sport) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error('fetchAndStoreLeagues -> API_KEY_THE_SPORTS_DB non défini.');
      return;
    }
    // L'endpoint all_leagues.php retourne toutes les ligues.
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/all_leagues.php`;
    logger.info(`fetchAndStoreLeagues -> Récupération de toutes les ligues pour le sport ${sport}`);
    const data = await fetchData(url);
    if (data && data.leagues && data.leagues.length > 0) {
      for (const league of data.leagues) {
        // Filtrer par sport
        if (league.strSport.toLowerCase() !== sport.toLowerCase()) continue;
        const query = `
          INSERT INTO leagues (id_league, strleague, strsport, strleaguealternate)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_league) DO UPDATE
            SET strleague = EXCLUDED.strleague,
                strsport = EXCLUDED.strsport,
                strleaguealternate = EXCLUDED.strleaguealternate,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const values = [league.idLeague, league.strLeague, league.strSport, league.strLeagueAlternate];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreLeagues -> Ligues pour le sport ${sport} mises à jour en BDD.`);
    } else {
      logger.warn(`fetchAndStoreLeagues -> Aucune ligue trouvée pour ${sport}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreLeagues -> Erreur pour ${sport}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreLeagues };
