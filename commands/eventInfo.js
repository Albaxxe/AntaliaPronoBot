// src/commands/eventInfo.js
const { SlashCommandBuilder } = require('discord.js');
const { getEventDetails } = require('../services/theSportsDBService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eventinfo')
    .setDescription('Récupère des informations sur un événement.')
    .addIntegerOption(option =>
      option.setName('eventid')
        .setDescription('ID de l’événement TheSportsDB')
        .setRequired(true)
    ),
  async execute(interaction) {
    const eventId = interaction.options.getInteger('eventid');
    await interaction.deferReply();

    try {
      const data = await getEventDetails(eventId);
      if (data && data.events) {
        const event = data.events[0];
        await interaction.editReply(`Événement : ${event.strEvent}\nDate : ${event.dateEvent}`);
      } else {
        await interaction.editReply('Aucun événement trouvé.');
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply('Erreur lors de la récupération de l’événement.');
    }
  }
};
