// services/apiUpdateScheduler.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const { fetchAndStoreEvent } = require('./apiDataService');
const { fetchAndStoreTeamInfo } = require('./teamDataService');
const { fetchAndStorePlayers } = require('./playerDataService');
const { fetchAndStoreUpcomingMatches } = require('./matchDataService');
require('dotenv').config();

function startApiUpdateScheduler() {
  logger.info("Démarrage du scheduler de mise à jour API.");
  // Planifier toutes les 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    logger.info("Scheduler API : Début de la mise à jour.");
    try {
      const testEventId = process.env.TEST_EVENT_ID || 1032862;
      await fetchAndStoreEvent(testEventId);
      
      const testTeam = "Arsenal";
      await fetchAndStoreTeamInfo(testTeam);
      await fetchAndStorePlayers(testTeam);
      await fetchAndStoreUpcomingMatches(testTeam);
      
      logger.info("Scheduler API : Mise à jour terminée.");
    } catch (error) {
      logger.error("Scheduler API : Erreur lors de la mise à jour : " + error.message);
    }
  });
}

module.exports = { startApiUpdateScheduler };
