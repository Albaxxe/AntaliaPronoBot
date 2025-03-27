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
    
    // Récupérer l'identifiant interne de l'équipe depuis la table teams
    const teamRes = await db.query(
      `SELECT id FROM teams WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [teamName]
    );
    let defaultTeamId = null;
    if (teamRes.rows.length > 0) {
      defaultTeamId = teamRes.rows[0].id;
      logger.info(`fetchAndStorePlayersForTeam -> team_id trouvé pour ${teamName}: ${defaultTeamId}`);
    } else {
      logger.warn(`fetchAndStorePlayersForTeam -> Aucun team_id trouvé pour l'équipe ${teamName} dans la table teams.`);
    }
    
    if (data && data.player && data.player.length > 0) {
      for (const player of data.player) {
        // Utiliser defaultTeamId si l'API ne fournit pas idTeam
        let teamId = defaultTeamId;
        if (player.idTeam) {
          teamId = parseInt(player.idTeam, 10);
        }
        if (!teamId) {
          logger.warn(`fetchAndStorePlayersForTeam -> Aucun team_id pour le joueur ${player.idPlayer} (${player.strPlayer}), ce joueur sera ignoré.`);
          continue;
        }
        const query = `
          INSERT INTO players (id_player, team_id, name, position, nationality, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (id_player) DO UPDATE
            SET team_id = EXCLUDED.team_id,
                name = EXCLUDED.name,
                position = EXCLUDED.position,
                nationality = EXCLUDED.nationality,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const values = [
          player.idPlayer,
          teamId,
          player.strPlayer,
          player.strPosition,
          player.strNationality,
        ];
        try {
          await db.query(query, values);
        } catch (err) {
          logger.error(`fetchAndStorePlayersForTeam -> Erreur d'insertion pour le joueur ${player.idPlayer}: ${err.message}`);
        }
      }
      logger.info(`fetchAndStorePlayersForTeam -> Mise à jour de ${data.player.length} joueurs pour ${teamName} en BDD.`);
    } else {
      logger.warn(`fetchAndStorePlayersForTeam -> Aucun joueur trouvé pour ${teamName}`);
    }
  } catch (error) {
    logger.error(`fetchAndStorePlayersForTeam -> Erreur pour ${teamName}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStorePlayersForTeam };
