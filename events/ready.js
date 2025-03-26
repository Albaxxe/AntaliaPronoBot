// src/events/ready.js
const { EmbedBuilder } = require('discord.js');
const { sendTicketPanel } = require('../services/ticketService');
require('dotenv').config();
const syncMembers = require('./syncMembers');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);

    // Initialiser le cache d'invites
    client.invites = new Map();
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const invites = await guild.invites.fetch(); 
        client.invites.set(guildId, invites);
      } catch (error) {
        console.error(`❌ Erreur lors du fetch des invites pour ${guild.name} :`, error.message);
      }
    }

    // Définir la présence du bot
    client.user.setPresence({
      activities: [{ name: 'En cours de création', type: 0 }],
      status: 'Actuellement au charbon',
    });

    // Synchroniser tous les membres existants dans la BDD
    await syncMembers.execute(client);

    // Exemple: On fetch l'event ID=1032862 au démarrage
    await fetchAndStoreEvent(1032862);

    // Envoyer le panel de ticket en utilisant le service dédié et la variable HELP_CHANNEL_IP
    await sendTicketPanel(client);

    await updateApiData();

    // Récupérer le salon pour l'embed de status
    const channelId = process.env.STATUS_CHANNEL_ID || '1352848213018677292';
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.log('❌ Channel non trouvé, impossible d’envoyer l’embed de status.');
      return;
    }

    // Tenter de récupérer un message existant identifié par un footer spécifique
    let statusMessage;
    try {
      const fetchedMessages = await channel.messages.fetch({ limit: 10 });
      statusMessage = fetchedMessages.find(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].footer &&
        msg.embeds[0].footer.text === 'PronoBOT - by Albaxxe Status'
      );
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des messages :', error);
    }

    // Si aucun message trouvé, on en envoie un nouveau
    if (!statusMessage) {
      const initialEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('Status du Bot')
        .setDescription('Suivi en temps réel du bot')
        .addFields(
          { name: 'Ping', value: 'Calcul en cours...', inline: true },
          { name: 'Staff en ligne', value: 'Calcul en cours...', inline: true }
        )
        .setFooter({ text: 'PronoBOT - by Albaxxe Status' })
        .setTimestamp();

      try {
        statusMessage = await channel.send({ embeds: [initialEmbed] });
        console.log('✅ Message de status envoyé.');
      } catch (error) {
        console.error('❌ Erreur envoi message de status :', error);
        return;
      }
    }

    // Mettre à jour l'embed toutes les 10 secondes
    const updateInterval = 10000;
    setInterval(async () => {
      try {
        // Récupérer le ping du bot
        const ping = client.ws.ping;

        // Calculer le nombre de staff en ligne (les intents GUILD_MEMBERS et PRESENCES doivent être activés)
        const staffRoleId = process.env.STAFF_ROLE_ID;
        let staffOnlineCount = 'N/A';
        if (staffRoleId) {
          const guild = channel.guild;
          await guild.members.fetch();
          const staffMembers = guild.members.cache.filter(member =>
            member.roles.cache.has(staffRoleId) &&
            member.presence && member.presence.status === 'online'
          );
          staffOnlineCount = staffMembers.size.toString();
        }

        // Construire le nouvel embed
        const newEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('Status du Bot')
          .setDescription('Suivi en temps réel du bot')
          .addFields(
            { name: 'Ping', value: `${ping} ms`, inline: true },
            { name: 'Staff en ligne', value: staffOnlineCount, inline: true }
          )
          .setFooter({ text: 'PronoBOT - by Albaxxe Status' })
          .setTimestamp();

        // Mettre à jour le message existant
        await statusMessage.edit({ embeds: [newEmbed] });
      } catch (err) {
        console.error('❌ Erreur lors de la mise à jour du status embed :', err);
      }
    }, updateInterval);
  },
};
