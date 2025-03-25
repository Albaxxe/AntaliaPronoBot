// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');

function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        // Le nom de l'événement est souvent le nom du fichier (ex : ready.js => "ready")
        const eventName = file.replace('.js', '');
        
        // event.once ? event.on ? selon la structure de ton code
        client.on(eventName, (...args) => event.execute(...args, client));
    }

    console.log('\n📂 Chargement des événements...');
    eventFiles.forEach(file => console.log(`   ➤ ${file.replace('.js', '')}`));
    console.log('✅ Tous les événements ont été chargés avec succès !\n');
}

module.exports = { loadEvents };
