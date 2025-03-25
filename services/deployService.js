// src/services/deployService.js
const { REST, Routes } = require('discord.js');

async function deployCommands(client) {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());
    const guildId = process.env.GUILD_ID;

    // Suppression des commandes existantes
    console.log('📢 Suppression des commandes (Guild)...');
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: [] }
    );
    console.log('✅ Anciennes commandes supprimées.');

    // Déploiement
    console.log('📢 Déploiement des nouvelles commandes (Guild)...');
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
    );
    console.log('✅ Nouvelles commandes enregistrées avec succès.');
}

module.exports = { deployCommands };
