// src/services/ticketDBService.js
const db = require('../utils/database');

/**
 * Crée un ticket dans la table `tickets`.
 * @param {string|number} channelId - L'ID du salon Discord.
 * @param {string|number} userId - L'ID de l'utilisateur (Discord).
 * @returns {Promise<Object>} Le ticket inséré.
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
    console.log(`✅ Ticket créé en BDD pour channel ${channelId} et user ${userId}:`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erreur lors de la création du ticket (channel ${channelId}, user ${userId}):`, error);
    throw error;
  }
}

/**
 * Met à jour la catégorie du ticket dans la BDD.
 * @param {string|number} channelId - L'ID du salon.
 * @param {string} category - La catégorie choisie.
 * @returns {Promise<Object>} Le ticket mis à jour.
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
    console.log(`✅ Ticket (channel ${channelId}) mis à jour en BDD avec la catégorie "${category}":`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du ticket (channel ${channelId}) en BDD:`, error);
    throw error;
  }
}

/**
 * Ferme le ticket (statut = 'closed') dans la BDD.
 * @param {string|number} channelId - L'ID du salon.
 * @returns {Promise<Object>} Le ticket mis à jour.
 */
async function closeTicket(channelId) {
  const query = `
    UPDATE tickets
    SET status = 'closed',
        updated_at = CURRENT_TIMESTAMP
    WHERE channel_id = $1
    RETURNING *;
  `;
  const values = [channelId];
  try {
    const result = await db.query(query, values);
    console.log(`✅ Ticket (channel ${channelId}) fermé en BDD:`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erreur lors de la fermeture du ticket (channel ${channelId}) en BDD:`, error);
    throw error;
  }
}

module.exports = {
  createTicket,
  updateTicketCategory,
  closeTicket
};
