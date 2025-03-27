// events/guildMemberAdd.js
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const { recordInviteUsage } = require('../services/memberDBService'); // Service pour enregistrer l'invitation
require('dotenv').config();

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Envoi de l'embed de bienvenue (existant déjà)
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (welcomeChannelId) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('Bienvenue sur le serveur !')
          .setDescription(`Salut <@${member.user.id}> ! Bienvenue sur **${member.guild.name}**.`)
          .addFields(
            { name: 'Présentation', value: "N'hésite pas à te présenter et à consulter les règles." },
            { name: 'Support', value: "Si besoin, ouvre un ticket dans le salon d'aide." }
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Nous sommes ravis de te compter parmi nous.' })
          .setTimestamp();
        try {
          await channel.send({ embeds: [welcomeEmbed] });
          logger.info(`guildMemberAdd -> Message de bienvenue envoyé pour ${member.user.tag}`);
        } catch (err) {
          logger.error(`guildMemberAdd -> Erreur lors de l'envoi du message de bienvenue: ${err.message}`);
        }
      } else {
        logger.warn(`guildMemberAdd -> Salon de bienvenue introuvable (ID: ${welcomeChannelId}).`);
      }
    } else {
      logger.warn("guildMemberAdd -> WELCOME_CHANNEL_ID non défini dans .env.");
    }

    // Déterminer quelle invitation a été utilisée
    try {
      // client.invites est initialisé dans ready.js et mis à jour lors de syncMembers.
      const cachedInvites = member.guild.client.invites.get(member.guild.id);
      // On refait un fetch des invites actuelles
      const newInvites = await member.guild.invites.fetch();
      
      // Comparer les compteurs pour trouver l'invite dont l'utilisation a augmenté
      const usedInvite = newInvites.find(inv => {
        const cached = cachedInvites.get(inv.code);
        return cached && inv.uses > cached.uses;
      });
      
      if (usedInvite) {
        logger.info(`guildMemberAdd -> ${member.user.tag} a rejoint via l'invite ${usedInvite.code} de ${usedInvite.inviter.tag}`);
        
        // Enregistre l'information en BDD via un service (à adapter)
        try {
          await recordInviteUsage(member.guild.id, member.id, usedInvite.inviter.id, usedInvite.code);
          logger.info(`guildMemberAdd -> Enregistrement de l'invitation réussi pour ${member.user.tag}.`);
        } catch (dbError) {
          logger.error(`guildMemberAdd -> Erreur enregistrement en BDD de l'invitation: ${dbError.message}`);
        }
        
        // Mettre à jour le cache des invitations pour le serveur
        member.guild.client.invites.set(member.guild.id, newInvites);
      } else {
        logger.warn(`guildMemberAdd -> Impossible de déterminer l'invite utilisée pour ${member.user.tag}.`);
      }
    } catch (error) {
      logger.error(`guildMemberAdd -> Erreur lors de la détermination de l'invitation: ${error.message}`);
    }
  }
};
