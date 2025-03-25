const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config(); // Charger les variables d'environnement

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
    console.error("❌ ERREUR : CLIENT_ID ou DISCORD_TOKEN manquant dans le fichier .env");
    process.exit(1);
}

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('📢 Mise à jour des commandes sur Discord...');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log('✅ Commandes mises à jour avec succès !');
    } catch (error) {
        console.error("❌ Erreur lors du déploiement des commandes :", error);
    }
})();
