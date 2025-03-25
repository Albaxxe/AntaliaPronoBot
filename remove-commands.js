// remove-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // Supprime toutes les commandes globales
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('✅ Toutes les commandes globales ont été supprimées.');

    // Supprime toutes les commandes dans le GUILD_ID
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] }
    );
    console.log(`✅ Toutes les commandes du serveur (Guild ID = ${process.env.GUILD_ID}) ont été supprimées.`);

  } catch (error) {
    console.error('❌ Erreur lors de la suppression des commandes :', error);
  }
})();
