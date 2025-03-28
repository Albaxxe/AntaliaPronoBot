// apiService.js
const axios = require('axios');
const pLimit = require('p-limit');
const config = require('../config');

// Limite de concurrence pour éviter de saturer l'API (par exemple, 5 appels simultanés)
const limit = pLimit(5);

// Création d'une instance axios préconfigurée
const apiClient = axios.create({
  baseURL: config.api.urlV2,
  timeout: 10000, // 10 secondes de timeout
});

// Optionnel : Ajout d'une logique de retry en cas d'erreur
// Vous pouvez intégrer axios-retry ou implémenter votre propre logique.
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    // Ici, vous pouvez logguer l'erreur dans une table "api_logs" ou autre
    console.error('Erreur API:', error.message);
    throw error;
  }
);

/**
 * Appel générique GET vers TheSportsDB
 * @param {string} endpoint - Par exemple, '/all_leagues.php'
 * @param {object} params - Paramètres additionnels
 */
async function get(endpoint, params = {}) {
  // Ajout de la clé d'API dans les paramètres
  const queryParams = {
    ...params,
    api_key: config.api.key,
  };

  return limit(async () => {
    const response = await apiClient.get(endpoint, { params: queryParams });
    return response.data;
  });
}

// Fonctions spécifiques pour récupérer les données

async function fetchAllLeagues() {
  // Endpoint à adapter selon la documentation v2
  return get('/all_leagues.php');
}

async function fetchTeamsByLeague(leagueId) {
  // Ex: '/lookup_all_teams.php?id=4328'
  return get('/lookup_all_teams.php', { id: leagueId });
}

async function fetchPlayersByTeam(teamId) {
  // Ex: '/lookup_all_players.php?id=133604'
  return get('/lookup_all_players.php', { id: teamId });
}

async function fetchNextEventsByLeague(leagueId) {
  // Ex: '/eventsnextleague.php?id=4328'
  return get('/eventsnextleague.php', { id: leagueId });
}

async function fetchPastEventsByLeague(leagueId) {
  // Ex: '/eventspastleague.php?id=4328'
  return get('/eventspastleague.php', { id: leagueId });
}

module.exports = {
  fetchAllLeagues,
  fetchTeamsByLeague,
  fetchPlayersByTeam,
  fetchNextEventsByLeague,
  fetchPastEventsByLeague,
};
