const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    console.log('\n📂 Chargement des commandes...');
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        // ICI : client.commands doit exister
        client.commands.set(command.data.name, command);
        console.log(`   ➤ ${command.data.name}`);
    }
    console.log('✅ Toutes les commandes ont été chargées avec succès !\n');
}

module.exports = { loadCommands };
