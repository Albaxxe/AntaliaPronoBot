const { updateAllApiData } = require('../services/apiUpdateScheduler');
require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updateapi')
    .setDescription('Met à jour manuellement toutes les données de l’API'),
  async execute(interaction) {
    const directionRoleId = process.env.DIRECTION_ROLE_ID;
    if (!interaction.member.roles.cache.has(directionRoleId)) {
      return interaction.reply({ content: "Vous n'avez pas la permission d'exécuter cette commande.", ephemeral: true });
    }
    try {
      await interaction.deferReply({ ephemeral: true });
      await updateAllApiData();
      await interaction.followUp({ content: "Mise à jour manuelle des données API effectuée avec succès.", ephemeral: true });
    } catch (error) {
      console.error(error);
      try {
        await interaction.followUp({ content: "Erreur lors de la mise à jour manuelle: " + error.message, ephemeral: true });
      } catch (err) {
        console.error("Impossible de répondre à l'interaction:", err);
      }
    }
  },
};
