// syncService.js
const {
    fetchAllLeagues,
    fetchTeamsByLeague,
    fetchNextEventsByLeague,
    fetchPastEventsByLeague
  } = require('./apiService');
  
  const {
    upsertLeague,
    upsertTeam,
    upsertMatch,
  } = require('./dbService');
  
  /**
   * Synchronise toutes les ligues
   */
  async function syncLeagues() {
    try {
      const data = await fetchAllLeagues();
      if (data && data.leagues) {
        for (const league of data.leagues) {
          await upsertLeague({
            idLeague: league.idLeague,
            strLeague: league.strLeague,
            strSport: league.strSport,
            strLeagueAlternate: league.strLeagueAlternate,
            description: league.strDescriptionFR || league.strDescriptionEN,
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors de syncLeagues:', err.message);
      // Vous pouvez logguer dans une table api_logs ici
    }
  }
  
  /**
   * Synchronise les équipes pour une ligue donnée
   */
  async function syncTeams(leagueId) {
    try {
      const data = await fetchTeamsByLeague(leagueId);
      if (data && data.teams) {
        for (const team of data.teams) {
          await upsertTeam({
            idTeam: team.idTeam,
            strTeam: team.strTeam,
            strCountry: team.strCountry,
            strStadium: team.strStadium,
            intFormedYear: team.intFormedYear,
            strDescriptionFR: team.strDescriptionFR || team.strDescriptionEN,
          });
        }
      }
    } catch (err) {
      console.error(`Erreur lors de syncTeams pour league ${leagueId}:`, err.message);
    }
  }
  
  /**
   * Synchronise les événements (matchs) pour une ligue donnée
   */
  async function syncEvents(leagueId) {
    try {
      // Récupère les prochains matchs
      const nextData = await fetchNextEventsByLeague(leagueId);
      if (nextData && nextData.events) {
        for (const ev of nextData.events) {
          await upsertMatch(ev);
        }
      }
  
      // Récupère les matchs passés (pour mettre à jour les scores et statuts)
      const pastData = await fetchPastEventsByLeague(leagueId);
      if (pastData && pastData.events) {
        for (const ev of pastData.events) {
          await upsertMatch(ev);
        }
      }
    } catch (err) {
      console.error(`Erreur lors de syncEvents pour league ${leagueId}:`, err.message);
    }
  }
  
  /**
   * Synchronisation complète : ligues, équipes et événements.
   * Vous pouvez personnaliser les IDs des ligues à synchroniser.
   */
  async function fullSync() {
    // 1) Synchroniser toutes les ligues
    await syncLeagues();
  
    // 2) Définir les IDs de ligues à synchroniser (par exemple, via un tableau ou récupérés en BDD)
    const leagueIds = [4328, 4335]; // À adapter selon vos besoins ou à récupérer dynamiquement
  
    // Pour chaque ligue, synchroniser les équipes et événements
    for (const leagueId of leagueIds) {
      await syncTeams(leagueId);
      await syncEvents(leagueId);
    }
  }
  
  module.exports = {
    fullSync,
    syncLeagues,
    syncTeams,
    syncEvents,
  };
  