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

    // =============================
    // Initialiser le cache d'invites
    // =============================
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

    // =============================
    // Mettre à jour la présence du bot
    // =============================
    client.user.setPresence({
      activities: [{ name: 'Support en ligne', type: 0 }],
      status: 'online',
    });
    logger.info("ready.js -> Présence du bot mise à jour.");

    // =============================
    // Synchroniser les membres en BDD
    // =============================
    try {
      await syncMembers.execute(client);
      logger.info("ready.js -> Synchronisation des membres terminée.");
    } catch (error) {
      logger.error("ready.js -> Erreur lors de la synchronisation des membres: " + error.message);
    }

    // =============================
    // Envoyer le panel de ticket dans HELP_CHANNEL_ID
    // =============================
    try {
      await sendTicketPanel(client);
      logger.info("ready.js -> Panel de ticket envoyé ou déjà existant.");
    } catch (error) {
      logger.error("ready.js -> Erreur lors de l'envoi du panel de ticket: " + error.message);
    }

    // =============================
    // Récupérer et stocker un événement test via l'API
    // =============================
    const testEventId = process.env.TEST_EVENT_ID || 1032862;
    try {
      await fetchAndStoreEvent(testEventId);
      logger.info(`ready.js -> Données API récupérées pour l'événement ${testEventId}.`);
    } catch (error) {
      logger.error(`ready.js -> Erreur fetchAndStoreEvent pour l'événement ${testEventId}: ${error.message}`);
    }

    // =============================
    // Démarrer le scheduler de mise à jour des données API
    // =============================
    try {
      startApiUpdateScheduler();
      logger.info("ready.js -> Scheduler de mise à jour API démarré.");
    } catch (error) {
      logger.error("ready.js -> Erreur lors du démarrage du scheduler API: " + error.message);
    }

    // =============================
    // Envoi et mise à jour du message "Bot en ligne" dans le salon "status-bot"
    // =============================
    const statusChannelId = process.env.STATUS_CHANNEL_ID; // Défini dans votre .env
    if (statusChannelId) {
      const statusChannel = client.channels.cache.get(statusChannelId);
      if (statusChannel) {
        try {
          // Recherche d'un message d'embed existant (identifié par le footer "Status-Bot")
          const messages = await statusChannel.messages.fetch({ limit: 10 });
          const oldMessage = messages.find(m =>
            m.author.id === client.user.id &&
            m.embeds.length > 0 &&
            m.embeds[0].footer &&
            m.embeds[0].footer.text === 'Status-Bot'
          );
          if (oldMessage) {
            await oldMessage.delete().catch(err => logger.error("Erreur lors de la suppression de l'ancien embed :", err));
          }

          // Fonction pour créer l'embed de statut
          const createStatusEmbed = () => {
            // Gestion du ping : si -1, on affiche "Calcul en cours..."
            const rawPing = client.ws.ping;
            const displayedPing = rawPing >= 0 ? `${rawPing}ms` : 'Calcul en cours...';

            // Récupérer le premier serveur (guild)
            const guild = client.guilds.cache.first();

            // Préparer les champs pour les rôles du staff
            const roleFields = [];
            if (guild && process.env.STAFF_ROLE_IDS) {
              const staffRoleIds = process.env.STAFF_ROLE_IDS.split(',');
              for (const roleId of staffRoleIds) {
                const role = guild.roles.cache.get(roleId.trim());
                if (!role) continue;

                // Filtrer les membres ayant ce rôle et étant en ligne
                const onlineMembers = role.members.filter(
                  m => m.presence && m.presence.status !== 'offline'
                );
                // Mentionner chaque membre
                const mentions = onlineMembers.map(m => `<@${m.id}>`).join(', ');

                // Champ inline pour les rôles
                roleFields.push({
                  name: role.name,
                  value: mentions.length > 0 ? mentions : 'Aucun membre en ligne',
                  inline: true
                });
              }
            }

            // Construction de l'embed
            const statusEmbed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle('Le bot est en ligne !')
              .setDescription(
                `**${client.user.tag}** est maintenant opérationnel.\n\n` +
                `Tapez \`/help\` pour voir les commandes disponibles !`
              )
              // Ajout du Ping en inline
              .addFields({ name: 'Ping', value: displayedPing, inline: true })
              // Ajout des champs de rôles du staff en inline
              .addFields(roleFields)
              .setFooter({ text: 'Status-Bot' })
              .setTimestamp();

            return statusEmbed;
          };

          // Envoi initial du message avec l'embed et la mention @everyone
          const statusMessage = await statusChannel.send({
            content: '@everyone Le bot est en ligne !',
            embeds: [createStatusEmbed()]
          });
          logger.info(`ready.js -> Message de statut envoyé dans le salon status-bot (ID: ${statusChannelId}).`);

          // Mise à jour de l'embed toutes les 20 millisecondes (20ms)
          setInterval(async () => {
            try {
              await statusMessage.edit({
                content: '@everyone Le bot est en ligne !',
                embeds: [createStatusEmbed()]
              });
            } catch (err) {
              logger.error("Erreur lors de la mise à jour du message de statut :", err);
            }
          }, 2000);

        } catch (err) {
          logger.error("ready.js -> Erreur lors de l'envoi du message de statut :", err);
        }
      } else {
        logger.warn(`ready.js -> Salon STATUS_CHANNEL_ID (${statusChannelId}) introuvable.`);
      }
    } else {
      logger.warn("ready.js -> STATUS_CHANNEL_ID non défini dans .env.");
    }

    console.log('✅ Ready event terminé.');
    logger.info('ready.js -> Ready event terminé.');
  }
};
