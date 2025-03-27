// services/apiUpdateScheduler.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const { fetchAndStoreEvent } = require('./apiDataService');
const { fetchAndStoreLeagues } = require('./leagueDataService');
const { fetchAndStoreAllTeams } = require('./teamDataService');
const { fetchAndStorePlayersForTeam } = require('./playerDataService');
const { fetchAndStoreUpcomingMatchesForLeague } = require('./matchDataService');
require('dotenv').config();

async function updateAllApiData() {
  try {
    // 1. Récupérer et stocker toutes les ligues pour un sport donné (par exemple "Soccer")
    const sport = "Soccer";
    logger.info(`updateAllApiData -> Mise à jour de toutes les ligues pour le sport ${sport}`);
    await fetchAndStoreLeagues(sport);

    // 2. Récupérer et stocker toutes les équipes pour ce sport
    logger.info(`updateAllApiData -> Mise à jour de toutes les équipes pour le sport ${sport}`);
    await fetchAndStoreAllTeams(sport);

    // 3. Pour chaque équipe, récupérer et stocker les joueurs
    // Ici, nous pourrions récupérer la liste des équipes depuis la BDD.
    // Pour simplifier, imaginons que nous avons une liste d'équipes (exemple)
    const teams = ["Arsenal", "Chelsea", "Liverpool"]; // à remplacer par une requête en BDD pour obtenir toutes les équipes
    for (const team of teams) {
      logger.info(`updateAllApiData -> Mise à jour des joueurs pour l'équipe ${team}`);
      await fetchAndStorePlayersForTeam(team);
    }

    // 4. Pour chaque ligue, récupérer et stocker les matchs à venir
    // De même, on suppose une liste de ligues (pour Soccer)
    // Vous pouvez aussi récupérer cette liste depuis la table leagues.
    const leagues = ["4328", "4335"]; // Exemple d'IDs de ligues (remplacez par la liste réelle depuis votre BDD)
    for (const leagueId of leagues) {
      logger.info(`updateAllApiData -> Mise à jour des matchs à venir pour la ligue ID ${leagueId}`);
      await fetchAndStoreUpcomingMatchesForLeague(leagueId);
    }
    
    // 5. Vous pouvez aussi récupérer des événements historiques sur plusieurs années en appelant fetchAndStoreEvent pour une série d'IDs
    logger.info("updateAllApiData -> Mise à jour globale des données API terminée.");
  } catch (error) {
    logger.error("updateAllApiData -> Erreur lors de la mise à jour globale : " + error.message);
    throw error;
  }
}

function startApiUpdateScheduler() {
  logger.info("startApiUpdateScheduler -> Démarrage du scheduler de mise à jour API.");
  // Planifier toutes les 10 minutes
  cron.schedule('*/5 * * * *', async () => {
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
