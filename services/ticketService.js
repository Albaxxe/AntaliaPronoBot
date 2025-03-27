// services/ticketService.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { createTicket, updateTicketCategory, closeTicket } = require('./ticketDBService');
require('dotenv').config();

/**
 * Envoie le panel de ticket dans le salon défini par HELP_CHANNEL_IP.
 * @param {Client} client - Le client Discord
 */
async function sendTicketPanel(client) {
  const helpChannelId = process.env.HELP_CHANNEL_IP;
  if (!helpChannelId) {
    console.log('sendTicketPanel : HELP_CHANNEL_IP non défini dans .env.');
    return;
  }

  // Récupérer le salon
  const panelChannel = client.channels.cache.get(helpChannelId);
  if (!panelChannel) {
    console.log(`sendTicketPanel : Impossible de trouver le salon ID=${helpChannelId}`);
    return;
  }

  // Vérifier s'il existe déjà un panel
  let existingMessage;
  try {
    const fetchedMessages = await panelChannel.messages.fetch({ limit: 10 });
    existingMessage = fetchedMessages.find(
      (msg) =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].footer &&
        msg.embeds[0].footer.text === 'Ticket Panel'
    );
  } catch (err) {
    console.error('sendTicketPanel : Erreur lors de la récupération des messages :', err);
  }

  if (existingMessage) {
    console.log('sendTicketPanel : Un panel de ticket existe déjà.');
    return;
  }

  // Créer l'embed du panel
  const panelEmbed = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle('Support Tickets')
    .setDescription(
      "Cliquez sur le bouton ci-dessous pour créer un ticket.\n\nNotre équipe vous répondra dès que possible !"
    )
    .setFooter({ text: 'Ticket Panel' })
    .setTimestamp();

  // Bouton "Créer un ticket"
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Créer un ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝')
  );

  try {
    await panelChannel.send({
      embeds: [panelEmbed],
      components: [buttonRow],
    });
    console.log('sendTicketPanel : Panel de ticket envoyé dans le salon help.');
  } catch (err) {
    console.error('sendTicketPanel : Erreur lors de l’envoi du panel :', err);
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

/**
 * Met à jour la catégorie en BDD et déplace le salon dans la catégorie Discord correspondante.
 */
async function updateTicketCategoryAndMoveChannel(channel, chosenCategory) {
  // Mapping
  const categoryMap = {
    SAV: process.env.ID_CATEGORIE_SAV,
    Question: process.env.ID_CATEGORIE_QUESTION,
    'Problème Technique': process.env.ID_CATEGORIE_PROBLEME_TECHNIQUE,
    Autre: process.env.ID_CATEGORIE_AUTRE,
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

module.exports = {
  sendTicketPanel,
  openTicketDB,
  updateTicketCategoryAndMoveChannel,
  closeTicketService,
};
