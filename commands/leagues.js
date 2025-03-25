const { SlashCommandBuilder } = require('discord.js');
const { getLeaguesV1, getLeaguesV2 } = require('../utils/sportsApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leagues')
        .setDescription("Affiche la liste des ligues disponibles via TheSportsDB")
        .addStringOption(option => 
            option.setName('version')
                .setDescription("Choisir l'API (V1 ou V2)")
                .setRequired(true)
                .addChoices(
                    { name: 'V1', value: 'V1' },
                    { name: 'V2', value: 'V2' }
                )),
    async execute(interaction) {
        await interaction.deferReply();
        
        const version = interaction.options.getString('version');
        const leagues = version === "V1" ? await getLeaguesV1() : await getLeaguesV2();

        if (!leagues.length) {
            return interaction.editReply(`❌ Aucune ligue trouvée en ${version}.`);
        }

        let response = `🏆 **Ligues disponibles (${version}) :**\n`;
        leagues.slice(0, 10).forEach(league => {
            response += `- **${league.strLeague}** (ID: ${league.idLeague})\n`;
        });

        await interaction.editReply(response);
    }
};
