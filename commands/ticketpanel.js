// src/commands/ticketpanel.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Envoie le panneau de création de ticket.'),
  async execute(interaction) {
    // Optionnel : vérification des permissions du staff
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: "Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('Support - Création de ticket')
      .setDescription("Cliquez sur le bouton ci-dessous pour créer un ticket.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: "Panneau de ticket envoyé !", ephemeral: true });
  },
};
