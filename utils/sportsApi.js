const axios = require('axios');
require('dotenv').config();

const API_V1_URL = process.env.API_URL_THE_SPORTS_DB_V1;
const API_V2_URL = process.env.API_URL_THE_SPORTS_DB_V2;
const API_KEY = process.env.API_KEY_THE_SPORTS_DB;

const headersV2 = {
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json"
};

/**
 * 📌 Fonction utilitaire pour construire l'URL de l'API
 */
const getApiUrl = (version, endpoint) => {
    const baseUrl = version === "V1" ? API_V1_URL : API_V2_URL;
    return `${baseUrl}/${API_KEY}/${endpoint}`;
};

/**
 * 📌 Récupère les détails d'un événement en API V1
 */
async function getEventDetailsV1(eventId) {
    const url = getApiUrl("V1", `lookupevent.php?id=${eventId}`);
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`❌ Erreur requête API V1 : ${error.message}`);
        return null;
    }
}

/**
 * 📌 Récupère les détails d'un événement en API V2
 */
async function getEventDetailsV2(eventId) {
    try {
        const response = await axios.post(`${API_V2_URL}/all/events`, { idEvent: eventId }, { headers: headersV2 });
        return response.data;
    } catch (error) {
        console.error(`❌ Erreur requête API V2 : ${error.message}`);
        return null;
    }
}

/**
 * 📌 Récupère toutes les ligues en API V1
 */
async function getLeaguesV1() {
    const url = getApiUrl("V1", "all_leagues.php");
    try {
        const { data } = await axios.get(url);
        return data.leagues || [];
    } catch (error) {
        console.error("❌ Erreur API V1 - Ligues :", error.message);
        return [];
    }
}

/**
 * 📌 Récupère toutes les ligues en API V2
 */
async function getLeaguesV2() {
    try {
        const response = await axios.post(`${API_V2_URL}/all/leagues`, {}, { headers: headersV2 });
        return response.data.leagues || [];
    } catch (error) {
        console.error("❌ Erreur API V2 - Ligues :", error.message);
        return [];
    }
}

/**
 * 📌 Récupère les équipes d'une ligue en API V1
 */
async function getTeamsV1(leagueId) {
    const url = getApiUrl("V1", `lookup_all_teams.php?id=${leagueId}`);
    try {
        const { data } = await axios.get(url);
        return data.teams || [];
    } catch (error) {
        console.error(`❌ Erreur API V1 - Équipes (Ligue ${leagueId}) :`, error.message);
        return [];
    }
}

/**
 * 📌 Récupère les équipes d'une ligue en API V2
 */
async function getTeamsV2(leagueId) {
    try {
        const response = await axios.post(`${API_V2_URL}/all/teams`, { idLeague: leagueId }, { headers: headersV2 });
        return response.data.teams || [];
    } catch (error) {
        console.error(`❌ Erreur API V2 - Équipes (Ligue ${leagueId}) :`, error.message);
        return [];
    }
}

module.exports = { 
    getEventDetailsV1, 
    getEventDetailsV2, 
    getLeaguesV1, 
    getLeaguesV2, 
    getTeamsV1, 
    getTeamsV2 
};
