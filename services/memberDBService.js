// services/memberDBService.js
const db = require('../utils/database');
const logger = require('../utils/logger');

async function recordInviteUsage(guildId, memberId, inviterId, inviteCode) {
  const query = `
    INSERT INTO invites (guild_id, member_id, inviter_id, invite_code, used_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (member_id) DO UPDATE
      SET inviter_id = EXCLUDED.inviter_id,
          invite_code = EXCLUDED.invite_code,
          used_at = EXCLUDED.used_at;
  `;
  const values = [guildId, memberId, inviterId, inviteCode];
  try {
    const result = await db.query(query, values);
    logger.info(`recordInviteUsage -> Invitation enregistrée pour member ${memberId}:`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    logger.error(`recordInviteUsage -> Erreur pour member ${memberId}: ${error.message}`);
    throw error;
  }
}

module.exports = { recordInviteUsage };
