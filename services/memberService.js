// src/services/memberService.js
const db = require('../utils/database');

/**
 * Vérifie si le membre existe déjà dans la table users_discord.
 * S'il n'existe pas, on l'insère dans la BDD.
 * @param {GuildMember} member - L'objet membre de Discord
 */
async function addMemberIfNotExists(member) {
  try {
    console.log(`🔍 Vérification du membre: ${member.user.tag} (ID: ${member.id})`);

    const selectRes = await db.query(
      'SELECT * FROM users_discord WHERE discord_user_id = $1',
      [member.id]
    );

    console.log(`   → Résultat de la requête SELECT pour ${member.user.tag}: rowCount = ${selectRes.rowCount}`);

    if (selectRes.rowCount === 0) {
      console.log(`   → Membre non trouvé en BDD, insertion de ${member.user.tag}...`);

      const insertQuery = `
        INSERT INTO users_discord 
          (user_id, discord_user_id, username, discriminator, avatar_url, joined_at)
        VALUES 
          ($1, $2, $3, $4, $5, $6)
      `;
      const values = [
        null, // Aucun compte utilisateur lié pour l'instant
        member.id,
        member.user.username,
        member.user.discriminator,
        member.user.displayAvatarURL({ format: 'png', dynamic: true }),
        member.joinedAt
      ];

      await db.query(insertQuery, values);
      console.log(`   → Insertion réussie pour ${member.user.tag}.`);
    } else {
      console.log(`   → Le membre ${member.user.tag} est déjà présent dans la BDD, aucune insertion.`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'ajout du membre ${member.user.tag} :`, error.message);
  }
}

module.exports = { addMemberIfNotExists };
