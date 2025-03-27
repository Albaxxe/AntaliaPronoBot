// services/apiUpdateScheduler.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const { fetchAndStoreEvent } = require('./apiDataService');
const { fetchAndStoreLeagues } = require('./leagueDataService');
const { fetchAndStoreAllTeamsForLeague } = require('./teamDataService');
const { fetchAndStorePlayersForTeam } = require('./playerDataService');
const { fetchAndStoreUpcomingMatchesForLeague } = require('./matchDataService');
require('dotenv').config();

async function updateAllApiData() {
  try {
    const sport = "Soccer";
    logger.info(`updateAllApiData -> Mise à jour de toutes les ligues pour le sport ${sport}`);
    await fetchAndStoreLeagues(sport);
    
    // Récupérer la liste des ligues depuis la BDD
    const leaguesRes = await require('../utils/database').query(
      `SELECT id_league FROM leagues`
    );
    const leagueIds = leaguesRes.rows.map(row => row.id_league);
    
    // Pour chaque ligue, récupérer les équipes et les matchs à venir
    for (const leagueId of leagueIds) {
      logger.info(`updateAllApiData -> Mise à jour des équipes pour la ligue ID ${leagueId}`);
      await fetchAndStoreAllTeamsForLeague(leagueId);
      
      logger.info(`updateAllApiData -> Mise à jour des matchs à venir pour la ligue ID ${leagueId}`);
      await fetchAndStoreUpcomingMatchesForLeague(leagueId);
    }
    
    // Pour les joueurs, vous pouvez décider d’itérer sur une liste d'équipes spécifiques ou récupérer la liste des équipes depuis la BDD.
    const teamsRes = await require('../utils/database').query(
      `SELECT name FROM teams`
    );
    const teamNames = teamsRes.rows.map(row => row.name);
    for (const teamName of teamNames) {
      logger.info(`updateAllApiData -> Mise à jour des joueurs pour l'équipe ${teamName}`);
      await fetchAndStorePlayersForTeam(teamName);
    }
    
    // Vous pouvez également récupérer un événement historique ou test
    const testEventId = process.env.TEST_EVENT_ID || 1032862;
    await fetchAndStoreEvent(testEventId);
    
    logger.info("updateAllApiData -> Mise à jour globale des données API terminée.");
  } catch (error) {
    logger.error("updateAllApiData -> Erreur lors de la mise à jour globale : " + error.message);
    throw error;
  }
}

function startApiUpdateScheduler() {
  logger.info("startApiUpdateScheduler -> Démarrage du scheduler de mise à jour API.");
  // Planifier toutes les 10 minutes
  cron.schedule('*/2 * * * *', async () => {
    logger.info("Scheduler API -> Début de la mise à jour programmée.");
    try {
      await updateAllApiData();
      logger.info("Scheduler API -> Mise à jour programmée terminée avec succès.");
    } catch (error) {
      logger.error("Scheduler API -> Erreur lors de la mise à jour programmée : " + error.message);
    }
  });
}

module.exports = { startApiUpdateScheduler, updateAllApiData };
