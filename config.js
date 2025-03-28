// config.js
require('dotenv').config();

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    channels: {
      notificationFootball: process.env.NOTIFICATION_FOOTBALL_CHANNEL_ID,
      reglement: process.env.REGLEMENT_CHANNEL_ID,
      welcome: process.env.WELCOME_CHANNEL_ID,
      help: process.env.HELP_CHANNEL_IP,
      command: process.env.COMMAND_CHANNEL_ID,
      status: process.env.STATUS_CHANNEL_ID,
    },
    categories: {
      bienvenue: process.env.ID_CATEGORIE_BIENVENUE,
      information: process.env.ID_CATEGORIE_INFORMATION,
      general: process.env.ID_CATEGORIE_GENERAL,
      vocaux: process.env.ID_CATEGORIE_VOCAUX,
      notification: process.env.ID_CATEGORIE_NOTIFICATION,
      staff: process.env.ID_CATEGORIE_STAFF,
      sav: process.env.ID_CATEGORIE_SAV,
      question: process.env.ID_CATEGORIE_QUESTION,
      problemeTechnique: process.env.ID_CATEGORIE_PROBLEME_TECHNIQUE,
      autre: process.env.ID_CATEGORIE_AUTRE,
    },
    roles: {
      staff: process.env.STAFF_ROLE_IDS.split(','),
      direction: process.env.DIRECTION_ROLE_ID,
      administration: process.env.ADMINISTRATION_ROLE_ID,
      moderation: process.env.MODERATION_ROLE_ID,
      animateur: process.env.ANIMATEUR_ROLE_ID,
      affilier: process.env.AFFILIER_ROLE_ID,
    }
  },
  api: {
    urlV1: process.env.API_URL_THE_SPORTS_DB_V1, // si besoin
    urlV2: process.env.API_URL_THE_SPORTS_DB_V2,
    key: process.env.API_KEY_THE_SPORTS_DB,
    testEventId: process.env.TEST_EVENT_ID,
  },
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
};
