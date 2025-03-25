// src/services/apiService.js
const { getEventDetailsV1, getEventDetailsV2 } = require('../utils/sportsApi');

async function checkExternalAPIs() {
    console.log('🔄 Test de connexion à TheSportsDB V1 & V2...');
    try {
        const eventV1 = await getEventDetailsV1(1032862);
        console.log(`✅ API V1 - Événement trouvé : ${eventV1?.events?.[0]?.strEvent || "Aucun"}`);

        const eventV2 = await getEventDetailsV2(1032862);
        console.log(`✅ API V2 - Événement trouvé : ${eventV2?.events?.[0]?.strEvent || "Aucun"}`);
    } catch (error) {
        console.error('❌ Erreur connexion à l\'API TheSportsDB :', error.message);
        // throw error; // si tu veux remonter l'erreur et stopper l'init
    }
}

module.exports = { checkExternalAPIs };
