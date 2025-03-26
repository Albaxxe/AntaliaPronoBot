// services/ticketService.js
const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const { createTicket, updateTicketCategory, closeTicket } = require('./ticketDBService');
require('dotenv').config();

/**
 * Met à jour la catégorie en BDD et déplace le salon dans la catégorie Discord correspondante.
 */
async function updateTicketCategoryAndMoveChannel(channel, chosenCategory) {
  // Mapping
  const categoryMap = {
    'SAV': process.env.ID_CATEGORIE_SAV,
    'Question': process.env.ID_CATEGORIE_QUESTION,
    'Problème Technique': process.env.ID_CATEGORIE_PROBLEME_TECHNIQUE,
    'Autre': process.env.ID_CATEGORIE_AUTRE
  };

  // 1) Déplacer le salon
  const parentId = categoryMap[chosenCategory];
  if (!parentId) {
    console.warn(`⚠️ Aucune catégorie définie pour "${chosenCategory}". Vérifiez .env et le mapping.`);
  } else {
    try {
      console.log(`Tentative de déplacement du salon ${channel.name} vers la catégorie ID=${parentId}`);
      await channel.setParent(parentId, { lockPermissions: false });
      console.log(`✅ Salon ${channel.name} déplacé dans la catégorie.`);
    } catch (err) {
      console.error(`❌ Erreur setParent pour ${channel.name}:`, err);
    }
  }

  // 2) Mettre à jour en BDD
  try {
    const updated = await updateTicketCategory(channel.id, chosenCategory);
    console.log(`✅ BDD : Ticket (channel=${channel.id}) maj category="${chosenCategory}" ->`, updated);
    return updated;
  } catch (error) {
    console.error(`❌ Erreur updateTicketCategoryAndMoveChannel (channel=${channel.id}):`, error);
    throw error;
  }
}

/**
 * Ferme un ticket en BDD (statut='closed').
 */
async function closeTicketService(channelId) {
  try {
    const closed = await closeTicket(channelId);
    console.log(`✅ Ticket fermé en BDD pour channel=${channelId}:`, closed);
    return closed;
  } catch (error) {
    console.error(`❌ Erreur closeTicketService (channel=${channelId}):`, error);
    throw error;
  }
}

/**
 * Crée un ticket en BDD après avoir créé le salon. 
 * @param {string} channelId - ID du salon
 * @param {string} userId - ID de l'utilisateur
 */
async function openTicketDB(channelId, userId) {
  try {
    const inserted = await createTicket(channelId, userId);
    console.log(`✅ openTicketDB: ticket inséré ->`, inserted);
    return inserted;
  } catch (error) {
    console.error(`❌ Erreur openTicketDB (channel=${channelId}, user=${userId}):`, error);
    throw error;
  }
}

module.exports = {
  updateTicketCategoryAndMoveChannel,
  closeTicketService,
  openTicketDB
};
