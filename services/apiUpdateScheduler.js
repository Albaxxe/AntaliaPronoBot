// services/apiUpdateScheduler.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const { fetchAndStoreEvent } = require('./apiDataService');
const { fetchAndStoreLeagues } = require('./leagueDataService');
const { fetchAndStoreAllTeams } = require('./teamDataService');  // Import corrigé ici
const { fetchAndStorePlayersForTeam } = require('./playerDataService');
const { fetchAndStoreUpcomingMatchesForLeague } = require('./matchDataService');
require('dotenv').config();

async function updateAllApiData() {
  try {
    const sport = "Soccer";
    logger.info(`updateAllApiData -> Mise à jour de toutes les ligues pour le sport ${sport}`);
    await fetchAndStoreLeagues(sport);
    
    logger.info(`updateAllApiData -> Mise à jour de toutes les équipes pour le sport ${sport}`);
    await fetchAndStoreAllTeams(sport);
    
    // Exemple : mise à jour des joueurs pour une équipe (à étendre)
    const teams = ["Arsenal"]; // Vous pouvez remplacer par une requête sur la BDD pour récupérer toutes les équipes
    for (const team of teams) {
      logger.info(`updateAllApiData -> Mise à jour des joueurs pour l'équipe ${team}`);
      await fetchAndStorePlayersForTeam(team);
    }
    
    // Exemple : mise à jour des matchs à venir pour des ligues
    const leagues = ["4328", "4335"]; // Remplacez par les vrais IDs de ligues (ou récupérez-les de la BDD)
    for (const leagueId of leagues) {
      logger.info(`updateAllApiData -> Mise à jour des matchs à venir pour la ligue ID ${leagueId}`);
      await fetchAndStoreUpcomingMatchesForLeague(leagueId);
    }
    
    logger.info("updateAllApiData -> Mise à jour globale des données API terminée.");
  } catch (error) {
    logger.error("updateAllApiData -> Erreur lors de la mise à jour globale : " + error.message);
    throw error;
  }
}

function startApiUpdateScheduler() {
  logger.info("startApiUpdateScheduler -> Démarrage du scheduler de mise à jour API.");
  // Planifier la mise à jour toutes les 10 minutes
  cron.schedule('*/10 * * * *', async () => {
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
