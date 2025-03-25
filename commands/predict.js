const { SlashCommandBuilder } = require('@discordjs/builders'), { getPrediction } = require('../utils/api');
module.exports = {
  data: new SlashCommandBuilder().setName('predict').setDescription('Obtenir les pronostics').addStringOption(o=>o.setName('match').setDescription('Match à prédire').setRequired(true)),
  async execute(interaction){
    const match=interaction.options.getString('match'); await interaction.deferReply();
    try{const p=await getPrediction(match); interaction.editReply(`📊 **${match}**: ${p.result} (${p.confidence}%)`);}
    catch(e){interaction.editReply('Impossible d’obtenir le pronostic.');}
  },
};
