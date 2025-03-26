// services/apiDataService.js
const { fetchData } = require('./apiRequestsService'); // Assure-toi que ce fichier existe et est correctement configuré
const db = require('../utils/database');
require('dotenv').config();

/**
 * Récupère les détails d'un événement via l'API et les insère (ou met à jour) dans la table api_events.
 * Cette fonction est à appeler au démarrage du bot.
 */
async function updateApiData() {
  try {
    const apiKey = process.env.THE_SPORTSDB_API_KEY;
    const eventId = process.env.TEST_EVENT_ID || 1032862; // Par exemple, un ID d'événement de test
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${eventId}`;
    
    console.log(`🔄 Récupération des données API pour l'événement ID ${eventId}`);
    const data = await fetchData(url);
    
    if (data && data.events && data.events.length > 0) {
      const event = data.events[0];
      console.log(`✅ Événement récupéré : ${event.strEvent}`);

      const query = `
        INSERT INTO api_events (id_event, strEvent, dateEvent)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_event) DO UPDATE
          SET strEvent = EXCLUDED.strEvent,
              dateEvent = EXCLUDED.dateEvent,
              updated_at = CURRENT_TIMESTAMP;
      `;
      const values = [event.idEvent, event.strEvent, event.dateEvent];
      await db.query(query, values);
      console.log("✅ Données de l'API mises à jour dans la BDD");
    } else {
      console.warn("⚠️ Aucun événement trouvé via l'API pour l'ID donné");
    }
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour des données API :", err.message);
  }
}

module.exports = { updateApiData };
