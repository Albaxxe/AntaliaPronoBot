// services/matchDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreUpcomingMatchesForLeague(leagueId) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStoreUpcomingMatchesForLeague -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsnextleague.php?id=${leagueId}`;
    logger.info(`fetchAndStoreUpcomingMatchesForLeague -> Récupération des matchs à venir pour la ligue ID ${leagueId}`);
    const data = await fetchData(url);
    if (data && data.events && data.events.length > 0) {
      for (const event of data.events) {
        const query = `
          INSERT INTO upcoming_matches (id_event, strevent, dateevent, strtime, venue, strsport, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT (id_event) DO UPDATE
            SET strevent = EXCLUDED.strevent,
                dateevent = EXCLUDED.dateevent,
                strtime = EXCLUDED.strtime,
                venue = EXCLUDED.venue,
                strsport = EXCLUDED.strsport,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const values = [
          event.idEvent,
          event.strEvent,
          event.dateEvent,
          event.strTime,       // Heure, vérifiez le nom exact dans la réponse API
          event.strVenue,      // Lieu
          event.strSport       // Type de sport
        ];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreUpcomingMatchesForLeague -> ${data.events.length} matchs à venir pour la ligue ${leagueId} mis à jour en BDD.`);
    } else {
      logger.warn(`fetchAndStoreUpcomingMatchesForLeague -> Aucun match trouvé pour la ligue ${leagueId}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreUpcomingMatchesForLeague -> Erreur pour la ligue ${leagueId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreUpcomingMatchesForLeague };
