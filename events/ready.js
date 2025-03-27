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
    logger.info(`Bot connecté en tant que ${client.user.tag}`);

    // Message "Bot en ligne" dans WELCOME_CHANNEL_ID
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
          logger.info("ready.js : Message 'Bot en ligne' envoyé dans le salon de bienvenue.");
        } catch (err) {
          logger.error("ready.js : Erreur lors de l'envoi du message 'Bot en ligne' :", err);
        }
      }
    }

    // Initialiser le cache d'invites
    client.invites = new Map();
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const invites = await guild.invites.fetch();
        client.invites.set(guildId, invites);
      } catch (error) {
        logger.error(`ready.js : Erreur lors du fetch des invites pour ${guild.name}: ${error.message}`);
      }
    }

    // Mettre à jour la présence du bot
    client.user.setPresence({
      activities: [{ name: 'Support en ligne', type: 0 }],
      status: 'online',
    });

    // Synchroniser les membres en BDD
    await syncMembers.execute(client);

    // Envoyer le panel de ticket
    await sendTicketPanel(client);

    // Récupérer et stocker un événement test via l'API
    const testEventId = process.env.TEST_EVENT_ID || 1032862;
    try {
      await fetchAndStoreEvent(testEventId);
      logger.info(`ready.js : Données API récupérées pour l'événement ${testEventId}.`);
    } catch (error) {
      logger.error(`ready.js : Erreur fetchAndStoreEvent pour l'événement ${testEventId}: ${error.message}`);
    }

    // Démarrer le scheduler de mise à jour API
    startApiUpdateScheduler();

    console.log('✅ Ready event terminé.');
    logger.info('Ready event terminé.');
  }
};
