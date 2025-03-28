// dbService.js
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

/**
 * Exemple : Upsert d'une ligue
 */
async function upsertLeague(leagueData) {
  const { idLeague, strLeague, strSport, strLeagueAlternate, description } = leagueData;

  const query = `
    INSERT INTO leagues (id_league, strleague, strsport, strleaguealternate, description)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id_league)
    DO UPDATE SET
      strleague = EXCLUDED.strleague,
      strsport = EXCLUDED.strsport,
      strleaguealternate = EXCLUDED.strleaguealternate,
      description = EXCLUDED.description,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  const values = [idLeague, strLeague, strSport, strLeagueAlternate, description];

  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

/**
 * Exemple : Upsert d'une équipe
 */
async function upsertTeam(teamData) {
  const {
    idTeam, strTeam, strCountry, strStadium,
    intFormedYear, strDescriptionFR,
  } = teamData;

  const query = `
    INSERT INTO teams (id_team, name, country, stadium, founded, description, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (id_team)
    DO UPDATE SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      stadium = EXCLUDED.stadium,
      founded = EXCLUDED.founded,
      description = EXCLUDED.description,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  const values = [
    idTeam,
    strTeam,
    strCountry,
    strStadium,
    intFormedYear,
    strDescriptionFR,
  ];

  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

/**
 * Exemple : Upsert d'un événement/match
 */
async function upsertMatch(eventData) {
  const {
    idEvent, strEvent, dateEvent, strTime,
    intHomeScore, intAwayScore
  } = eventData;

  // Par exemple, on définit "isupcoming" selon la date de l'événement
  const isUpcoming = dateEvent && new Date(dateEvent) >= new Date();

  const query = `
    INSERT INTO api_events (id_event, strevent, dateevent, isupcoming, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (id_event)
    DO UPDATE SET
      strevent = EXCLUDED.strevent,
      dateevent = EXCLUDED.dateevent,
      isupcoming = EXCLUDED.isupcoming,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  const values = [
    idEvent,
    strEvent,
    dateEvent,
    isUpcoming
  ];

  const client = await pool.connect();
  try {
    const result = await client.query(query, values);
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

module.exports = {
  upsertLeague,
  upsertTeam,
  upsertMatch,
  // Vous pouvez ajouter d'autres fonctions pour les joueurs, les logs, etc.
};
