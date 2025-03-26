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
  try {
    const result = await db.query(query, values);
    console.log(`✅ Ticket créé en BDD (channel=${channelId}, user=${userId}):`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erreur lors de la création du ticket (channel=${channelId}, user=${userId}):`, error);
    throw error;
  }
}

/**
 * Met à jour la catégorie d'un ticket (et updated_at).
 */
async function updateTicketCategory(channelId, category) {
  const query = `
    UPDATE tickets
    SET category = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE channel_id = $1
    RETURNING *;
  `;
  const values = [channelId, category];
  try {
    const result = await db.query(query, values);
    console.log(`✅ Ticket (channel=${channelId}) mis à jour avec category="${category}":`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erreur updateTicketCategory (channel=${channelId}):`, error);
    throw error;
  }
}

/**
 * Ferme un ticket (statut = 'closed').
 */
async function closeTicket(channelId) {
  const query = `
    UPDATE tickets
    SET status = 'closed',
        updated_at = CURRENT_TIMESTAMP
    WHERE channel_id = $1
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [channelId]);
    console.log(`✅ Ticket fermé (channel=${channelId}):`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erreur closeTicket (channel=${channelId}):`, error);
    throw error;
  }
}

module.exports = {
  createTicket,
  updateTicketCategory,
  closeTicket
};
