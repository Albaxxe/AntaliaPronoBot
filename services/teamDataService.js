// services/teamDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Fonction pour nettoyer le nom du fichier
function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Fonction pour télécharger l'image du logo
async function downloadLogo(logoUrl, teamName) {
  try {
    if (!logoUrl) return null;
    // Extraire l'extension depuis l'URL, par exemple .png ou .jpg
    const extMatch = logoUrl.match(/\.(png|jpg|jpeg|gif)(\?.*)?$/i);
    const extension = extMatch ? extMatch[0].split('?')[0] : '.png';
    
    const sanitizedTeamName = sanitizeFileName(teamName);
    const logoFolder = path.join(__dirname, '../logos');
    
    // Assurez-vous que le dossier logos existe
    if (!fs.existsSync(logoFolder)) {
      fs.mkdirSync(logoFolder, { recursive: true });
    }
    
    const localPath = path.join(logoFolder, `${sanitizedTeamName}${extension}`);
    
    // Télécharger l'image via axios et l'écrire dans le fichier local
    const response = await axios({
      url: logoUrl,
      method: 'GET',
      responseType: 'stream'
    });
    
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    logger.info(`Logo téléchargé pour ${teamName} dans ${localPath}`);
    return localPath;
  } catch (error) {
    logger.error(`Erreur lors du téléchargement du logo pour ${teamName}: ${error.message}`);
    return null;
  }
}

async function fetchAndStoreAllTeamsForLeague(leagueId) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStoreAllTeamsForLeague -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_teams.php?id=${leagueId}`;
    logger.info(`fetchAndStoreAllTeamsForLeague -> Récupération de toutes les équipes pour la ligue ID ${leagueId}`);
    const data = await fetchData(url);
    if (data && data.teams && data.teams.length > 0) {
      for (const team of data.teams) {
        // Télécharge le logo et récupère le chemin local (ceci est complémentaire, la BDD gardera le lien d'origine)
        const localLogoPath = await downloadLogo(team.strTeamBadge, team.strTeam);
        
        const query = `
          INSERT INTO teams (id_team, name, country, logo_url, description, founded, stadium, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id_team) DO UPDATE
            SET name = EXCLUDED.name,
                country = EXCLUDED.country,
                logo_url = EXCLUDED.logo_url,
                description = EXCLUDED.description,
                founded = EXCLUDED.founded,
                stadium = EXCLUDED.stadium,
                updated_at = CURRENT_TIMESTAMP;
        `;
        // Nous utilisons ici team.strDescriptionEN mais vous pouvez remplacer par team.strDescriptionFR si disponible
        const values = [
          team.idTeam,
          team.strTeam,
          team.strCountry,
          team.strTeamBadge, // on stocke l'URL dans la BDD
          team.strDescriptionEN || team.strDescriptionFR || null, // utiliser la description en anglais ou en français
          team.intFormedYear,
          team.strStadium
        ];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreAllTeamsForLeague -> ${data.teams.length} équipes mises à jour en BDD pour la ligue ${leagueId}.`);
    } else {
      logger.warn(`fetchAndStoreAllTeamsForLeague -> Aucune équipe trouvée pour la ligue ID ${leagueId}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreAllTeamsForLeague -> Erreur pour la ligue ID ${leagueId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreAllTeamsForLeague };
