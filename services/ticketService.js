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
 * Envoie le panel de ticket dans le salon défini par HELP_CHANNEL_IP.
 * Si un panel existe déjà (identifié par son footer "Ticket Panel"), il n'envoie pas un nouveau message.
 * @param {Client} client - Le client Discord
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
      .setTitle('Support Tickets')
      .setDescription("Cliquez sur le bouton ci-dessous pour créer un ticket.")
      .setFooter({ text: 'Ticket Panel' })
      .setTimestamp();

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
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
 * Met à jour la catégorie du ticket en BDD et déplace le salon Discord dans la catégorie correspondante.
 * Le mapping des catégories est défini via des variables d'environnement.
 * @param {TextChannel} channel - Le salon du ticket
 * @param {string} chosenCategory - La catégorie choisie (par ex. "SAV", "Question", "Problème Technique", "Autre")
 * @returns {Promise<Object>} Le ticket mis à jour (selon la BDD)
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
  if (parentId) {
    try {
      await channel.setParent(parentId);
      console.log(`Le salon ${channel.name} a été déplacé dans la catégorie correspondante.`);
    } catch (error) {
      console.error('Erreur lors du changement de catégorie du salon :', error);
    }
  } else {
    console.warn('Aucune catégorie définie pour la valeur:', chosenCategory);
  }

  // Mise à jour du ticket en BDD
  try {
    const updatedTicket = await updateTicketCategory(channel.id, chosenCategory);
    console.log(`La catégorie du ticket (channel ${channel.id}) a été mise à jour en BDD.`);
    return updatedTicket;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie du ticket en BDD:', error);
    throw error;
  }
}

module.exports = {
  sendTicketPanel,
  updateTicketCategoryAndMoveChannel
};
