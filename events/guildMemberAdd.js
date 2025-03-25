// events/guildMemberAdd.js
const { addMemberIfNotExists } = require('../services/memberService');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    console.log(`⚡ [guildMemberAdd] Nouveau membre : ${member.user.tag}`);

    // 1) Ajouter le membre dans la BDD si nécessaire
    await addMemberIfNotExists(member);

    // 2) Comparer l'état des invites
    try {
      const guild = member.guild;
      // Récupération des invites après l'arrivée du nouveau membre
      const newInvites = await guild.invites.fetch();

      // Récupération de l'état précédent depuis le cache
      // Assurez-vous que "invites" a été initialisé dans ready.js (client.invites = new Map())
      const oldInvites = member.client.invites.get(guild.id);

      // On cherche l’invite dont le compteur d’utilisation (uses) a augmenté
      const usedInvite = newInvites.find(inv => {
        const oldInvite = oldInvites?.get(inv.code);
        return oldInvite && inv.uses > oldInvite.uses;
      });

      // Mettre à jour le cache
      member.client.invites.set(guild.id, newInvites);

      if (!usedInvite) {
        console.log(`❓ Impossible de déterminer l'invite utilisée pour ${member.user.tag}`);
      } else {
        console.log(`🔗 Invite utilisée : ${usedInvite.code} | Inviter = ${usedInvite.inviter?.tag}`);

        // Si vous utilisez un système d'affiliation, on cherche l'affilié
        // Sinon, on s'appuie sur usedInvite.inviter.id
        const inviterId = usedInvite.inviter ? usedInvite.inviter.id : null;
        if (inviterId) {
          // Insertion dans discord_invites, par exemple
          await db.query(
            `INSERT INTO discord_invites (inviter_id, invitee_id) VALUES ($1, $2)`,
            [inviterId, member.id]
          );
          console.log(`✅ [discord_invites] ${inviterId} a invité ${member.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la détection du lien d\'invitation :', error.message);
    }
  },
};
