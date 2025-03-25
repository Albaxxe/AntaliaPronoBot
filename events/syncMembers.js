// src/events/syncMembers.js
const { addMemberIfNotExists } = require('../services/memberService');

module.exports = {
  name: 'syncMembers',
  once: true, // s'exécute une seule fois
  async execute(client) {
    console.log('🔄 [syncMembers] Démarrage de la synchronisation des membres...');

    client.guilds.cache.forEach(async guild => {
      try {
        console.log(`   → Traitement du serveur : ${guild.name} (ID: ${guild.id})`);
        // Récupérer tous les membres du serveur
        const members = await guild.members.fetch();
        console.log(`   → Nombre de membres récupérés : ${members.size} pour ${guild.name}`);

        for (const member of members.values()) {
          // On ignore les bots
          if (!member.user.bot) {
            console.log(`     → Synchronisation du membre : ${member.user.tag}`);
            await addMemberIfNotExists(member);
          } else {
            console.log(`     → Membre ignoré (bot) : ${member.user.tag}`);
          }
        }
        console.log(`✅ [syncMembers] Synchronisation terminée pour ${guild.name}`);
      } catch (error) {
        console.error(`❌ [syncMembers] Erreur lors de la synchro pour ${guild.name} :`, error.message);
      }
    });
  },
};
