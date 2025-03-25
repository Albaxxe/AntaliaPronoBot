// services/ticketDBService.js
const db = require('../utils/database');

/**
 * Crée un ticket dans la table `tickets`.
 */
async function createTicket(channelId, userId) {
  const query = `
    INSERT INTO tickets (channel_id, user_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [channelId, userId];
  const res = await db.query(query, values);
  return res.rows[0];
}

/**
 * Met à jour la catégorie du ticket.
 */
async function updateTicketCategory(channelId, category) {
  const query = `
    UPDATE tickets
    SET category = $2
    WHERE channel_id = $1
    RETURNING *;
  `;
  const values = [channelId, category];
  const res = await db.query(query, values);
  return res.rows[0];
}

/**
 * Ferme le ticket (statut=closed).
 */
async function closeTicket(channelId) {
  const query = `
    UPDATE tickets
    SET status = 'closed'
    WHERE channel_id = $1
    RETURNING *;
  `;
  const values = [channelId];
  const res = await db.query(query, values);
  return res.rows[0];
}

module.exports = {
  createTicket,
  updateTicketCategory,
  closeTicket
};
