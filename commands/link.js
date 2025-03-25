// src/commands/link.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
require('dotenv').config();

const AFFILIER_ROLE_ID = process.env.AFFILIER_ROLE_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Affiche votre lien d\'invitation unique ainsi que vos statistiques d\'invitation.'),
  async execute(interaction) {
    // Vérifier que l'utilisateur possède le rôle affilié
    if (!interaction.member.roles.cache.has(AFFILIER_ROLE_ID)) {
      return interaction.reply({ content: "Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
    }

    try {
      // Vérifier si l'utilisateur a déjà un lien affilié enregistré
      let affiliateLink;
      const linkResult = await db.query(
        'SELECT invite_link, invite_code FROM affiliate_links WHERE discord_user_id = $1',
        [interaction.user.id]
      );
      if (linkResult.rowCount > 0) {
        affiliateLink = linkResult.rows[0].invite_link;
      } else {
        // Si aucun lien n'existe, générer un lien unique depuis le salon courant
        const invite = await interaction.channel.createInvite({
          maxAge: 0,       // lien permanent
          maxUses: 0,      // utilisations illimitées
          unique: true,
          reason: `Lien d'invitation généré pour ${interaction.user.tag}`,
        });
        affiliateLink = invite.url;
        const inviteCode = invite.code; // On stocke également le code
        await db.query(
          'INSERT INTO affiliate_links (discord_user_id, invite_link, invite_code) VALUES ($1, $2, $3)',
          [interaction.user.id, affiliateLink, inviteCode]
        );
      }

      // Récupérer le nombre d'invités et leurs pseudos
      const invitesResult = await db.query(
        `SELECT u.username
         FROM discord_invites di
         JOIN users_discord u ON u.discord_user_id = di.invitee_id
         WHERE di.inviter_id = $1`,
        [interaction.user.id]
      );

      const count = invitesResult.rowCount;
      let invitedUsernames = invitesResult.rows.map(row => row.username);
      if (invitedUsernames.length === 0) {
        invitedUsernames = ['Aucun invité pour le moment.'];
      }

      // Construire l'embed avec les informations
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle("Statistiques d'invitation")
        .setDescription(`Votre lien d'invitation unique : ${affiliateLink}`)
        .addFields(
          { name: 'Nombre d\'invités', value: count.toString(), inline: true },
          { name: 'Invités', value: invitedUsernames.join(', '), inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Gérez vos invitations avec /link' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Erreur dans la commande /link:', error);
      return interaction.reply({ content: "Une erreur s'est produite lors de la récupération de vos invitations.", ephemeral: true });
    }
  },
};
