// events/guildMemberAdd.js
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Récupération du salon de bienvenue
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) {
      console.log("guildMemberAdd : WELCOME_CHANNEL_ID non défini dans .env.");
      return;
    }
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) {
      console.log(`guildMemberAdd : Impossible de trouver le salon ID=${welcomeChannelId}`);
      return;
    }

    // Créer un embed de bienvenue
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('Bienvenue sur le serveur !')
      .setDescription(`Salut <@${member.user.id}> ! Nous te souhaitons la bienvenue sur **${member.guild.name}**.`)
      .addFields(
        { name: 'Présentation', value: "N'hésite pas à te présenter et à consulter les règles du serveur." },
        { name: 'Support', value: "Si tu as des questions, ouvre un ticket dans le salon d'aide." }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Nous sommes ravis de te compter parmi nous.' })
      .setTimestamp();

    // Envoyer l'embed dans le salon de bienvenue
    try {
      await channel.send({ embeds: [welcomeEmbed] });
      console.log(`guildMemberAdd : Message de bienvenue envoyé pour ${member.user.tag}`);
    } catch (err) {
      console.error(`guildMemberAdd : Erreur lors de l'envoi du message de bienvenue :`, err);
    }
  }
};
