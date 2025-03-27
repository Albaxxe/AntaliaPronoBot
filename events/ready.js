// events/ready.js
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const syncMembers = require('./syncMembers');
const { sendTicketPanel } = require('../services/ticketService');
const { fetchAndStoreEvent } = require('../services/apiDataService');
const { startApiUpdateScheduler } = require('../services/apiUpdateScheduler');
const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    logger.info(`ready.js -> Bot connecté en tant que ${client.user.tag}`);

    // Envoyer le message "Bot en ligne" dans WELCOME_CHANNEL_ID
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (welcomeChannelId) {
      const channel = client.channels.cache.get(welcomeChannelId);
      if (channel) {
        try {
          const onlineEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Bot en ligne')
            .setDescription(`Le bot est opérationnel en tant que ${client.user.tag}`)
            .setTimestamp();
          await channel.send({ embeds: [onlineEmbed] });
          logger.info(`ready.js -> Message 'Bot en ligne' envoyé dans le salon ${welcomeChannelId}.`);
        } catch (err) {
          logger.error("ready.js -> Erreur lors de l'envoi du message 'Bot en ligne' :", err);
        }
      } else {
        logger.warn(`ready.js -> Salon WELCOME_CHANNEL_ID (${welcomeChannelId}) introuvable.`);
      }
    } else {
      logger.warn("ready.js -> WELCOME_CHANNEL_ID non défini dans .env.");
    }

    // Initialiser le cache d'invites
    client.invites = new Map();
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const invites = await guild.invites.fetch();
        client.invites.set(guildId, invites);
        logger.info(`ready.js -> Invites récupérées pour ${guild.name}`);
      } catch (error) {
        logger.error(`ready.js -> Erreur lors du fetch des invites pour ${guild.name}: ${error.message}`);
      }
    }

    // Mettre à jour la présence du bot
    client.user.setPresence({
      activities: [{ name: 'Support en ligne', type: 0 }],
      status: 'online',
    });
    logger.info("ready.js -> Présence du bot mise à jour.");

    // Synchroniser les membres en BDD
    try {
      await syncMembers.execute(client);
      logger.info("ready.js -> Synchronisation des membres terminée.");
    } catch (error) {
      logger.error("ready.js -> Erreur lors de la synchronisation des membres: " + error.message);
    }

    // Envoyer le panel de ticket dans HELP_CHANNEL_IP
    try {
      await sendTicketPanel(client);
      logger.info("ready.js -> Panel de ticket envoyé ou déjà existant.");
    } catch (error) {
      logger.error("ready.js -> Erreur lors de l'envoi du panel de ticket: " + error.message);
    }

    // Récupérer et stocker un événement test via l'API
    const testEventId = process.env.TEST_EVENT_ID || 1032862;
    try {
      await fetchAndStoreEvent(testEventId);
      logger.info(`ready.js -> Données API récupérées pour l'événement ${testEventId}.`);
    } catch (error) {
      logger.error(`ready.js -> Erreur fetchAndStoreEvent pour l'événement ${testEventId}: ${error.message}`);
    }

    // Démarrer le scheduler de mise à jour des données API
    try {
      startApiUpdateScheduler();
      logger.info("ready.js -> Scheduler de mise à jour API démarré.");
    } catch (error) {
      logger.error("ready.js -> Erreur lors du démarrage du scheduler API: " + error.message);
    }

    console.log('✅ Ready event terminé.');
    logger.info('ready.js -> Ready event terminé.');
  }
};
