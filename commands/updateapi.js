// commands/updateapi.js
const { updateAllApiData } = require('../services/apiUpdateScheduler');
require('dotenv').config();

module.exports = {
  data: {
    name: 'updateapi',
    description: 'Met à jour manuellement toutes les données de l’API',
  },
  async execute(interaction) {
    // Vérifier que l'utilisateur possède le rôle "Direction"
    const directionRoleId = process.env.DIRECTION_ROLE_ID;
    if (!interaction.member.roles.cache.has(directionRoleId)) {
      return interaction.reply({ content: "Vous n'avez pas la permission d'exécuter cette commande.", ephemeral: true });
    }
    try {
      await updateAllApiData();
      interaction.reply({ content: "Mise à jour manuelle des données API effectuée avec succès.", ephemeral: true });
    } catch (error) {
      interaction.reply({ content: "Erreur lors de la mise à jour manuelle: " + error.message, ephemeral: true });
    }
  },
};
