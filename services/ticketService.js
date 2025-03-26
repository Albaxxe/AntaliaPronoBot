// src/services/ticketService.js
const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const { createTicket, updateTicketCategory, closeTicket } = require('./ticketDBService');
require('dotenv').config();

/**
 * Envoie le panel de ticket dans le salon d'aide défini par HELP_CHANNEL_IP.
 */
async function sendTicketPanel(client) {
  const helpChannelId = process.env.HELP_CHANNEL_IP;
  if (!helpChannelId) {
    console.error('HELP_CHANNEL_IP non défini dans .env.');
    return;
  }

  const panelChannel = client.channels.cache.get(helpChannelId);
  if (!panelChannel) {
    console.error(`Salon de ticket non trouvé pour l'ID: ${helpChannelId}`);
    return;
  }

  let panelMessage;
  try {
    const fetchedMessages = await panelChannel.messages.fetch({ limit: 10 });
    panelMessage = fetchedMessages.find(msg =>
      msg.author.id === client.user.id &&
      msg.embeds.length > 0 &&
      msg.embeds[0].footer &&
      msg.embeds[0].footer.text === 'Ticket Panel'
    );
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du panel :', error);
  }

  if (!panelMessage) {
    const panelEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('📩 Support Tickets')
      .setDescription("Cliquez sur le bouton ci-dessous pour créer un ticket.\n\nNotre équipe vous répondra dès que possible !")
      .setFooter({ text: 'Ticket Panel' })
      .setTimestamp();

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝')
    );
    console.log(`Envoi du panel dans le salon ID: ${helpChannelId}, name: ${panelChannel?.name}`);
    
    try {
      panelMessage = await panelChannel.send({ embeds: [panelEmbed], components: [buttonRow] });
      console.log('✅ Panel de ticket envoyé.');
    } catch (error) {
      console.error('❌ Erreur lors de l’envoi du panel :', error);
    }
  } else {
    console.log('ℹ️ Un panel de ticket existe déjà.');
  }
}

/**
 * Met à jour la catégorie du ticket et déplace le salon dans la catégorie Discord correspondante.
 * Ajoute des logs pour suivre l'opération.
 * @param {TextChannel} channel - Le salon du ticket.
 * @param {string} chosenCategory - La catégorie choisie (par ex. "SAV", "Question", "Problème Technique", "Autre").
 * @returns {Promise<Object>} Le ticket mis à jour en BDD.
 */
async function updateTicketCategoryAndMoveChannel(channel, chosenCategory) {
  // Mapping des catégories via les variables d'environnement
  const categoryMap = {
    'SAV': process.env.ID_CATEGORIE_SAV,
    'Question': process.env.ID_CATEGORIE_QUESTION,
    'Problème Technique': process.env.ID_CATEGORIE_PROBLEME_TECHNIQUE,
    'Autre': process.env.ID_CATEGORIE_AUTRE
  };

  const parentId = categoryMap[chosenCategory];
  if (!parentId) {
    console.warn(`⚠️ Aucune catégorie Discord définie pour ${chosenCategory}. Vérifiez .env et le mapping.`);
  } else {
    try {
      console.log(`Tentative de déplacement du salon ${channel.name} vers la catégorie ID = ${parentId}`);
      await channel.setParent(parentId, { lockPermissions: false });
      console.log(`✅ Salon ${channel.name} déplacé dans la catégorie.`);
    } catch (error) {
      console.error('❌ Erreur lors du déplacement du salon :', error);
    }
  }

  // Mise à jour en BDD
  try {
    const updatedTicket = await updateTicketCategory(channel.id, chosenCategory);
    console.log(`✅ BDD : Ticket (channel ${channel.id}) mis à jour avec la catégorie "${chosenCategory}".`);
    return updatedTicket;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la BDD pour le ticket (channel ' + channel.id + '):', error);
    throw error;
  }
}

/**
 * Ferme un ticket : met à jour la BDD et retourne le ticket fermé.
 * @param {string|number} channelId - L'ID du salon.
 * @returns {Promise<Object>} Le ticket fermé.
 */
async function closeTicketService(channelId) {
  try {
    const closedTicket = await closeTicket(channelId);
    console.log(`✅ Ticket (channel ${channelId}) fermé en BDD.`);
    return closedTicket;
  } catch (error) {
    console.error(`❌ Erreur lors de la fermeture du ticket (channel ${channelId}) en BDD:`, error);
    throw error;
  }
}

module.exports = {
  sendTicketPanel,
  updateTicketCategoryAndMoveChannel,
  closeTicketService
};
