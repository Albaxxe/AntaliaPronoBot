// services/leagueDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Récupère toutes les ligues pour un sport donné et les stocke dans la table leagues.
 * Ici, on utilise l'endpoint "all_leagues.php" qui renvoie toutes les ligues.
 */
async function fetchAndStoreLeagues(sport) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error('fetchAndStoreLeagues -> API_KEY_THE_SPORTS_DB non défini.');
      return;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/all_leagues.php`;
    logger.info(`fetchAndStoreLeagues -> Récupération de toutes les ligues pour le sport ${sport}`);
    const data = await fetchData(url);
    if (data && data.leagues && data.leagues.length > 0) {
      for (const league of data.leagues) {
        // On peut filtrer par sport si nécessaire
        if (league.strSport.toLowerCase() !== sport.toLowerCase()) continue;
        const query = `
          INSERT INTO leagues (id_league, strLeague, strSport, strLeagueAlternate)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_league) DO UPDATE
            SET strLeague = EXCLUDED.strLeague,
                strSport = EXCLUDED.strSport,
                strLeagueAlternate = EXCLUDED.strLeagueAlternate,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const values = [league.idLeague, league.strLeague, league.strSport, league.strLeagueAlternate];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreLeagues -> Ligues pour ${sport} mises à jour en BDD.`);
    } else {
      logger.warn(`fetchAndStoreLeagues -> Aucune ligue trouvée pour ${sport}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreLeagues -> Erreur pour ${sport}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreLeagues };
