// src/services/theSportsDBService.js
const { fetchData } = require('./apiRequestsService');

async function getEventDetails(eventId) {
  const apiKey = process.env.THE_SPORTSDB_API_KEY;
  const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${eventId}`;
  const data = await fetchData(url, 30_000); // cache 30s
  return data;
}

async function getTeamInfo(teamName) {
  const apiKey = process.env.THE_SPORTSDB_API_KEY;
  const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
  const data = await fetchData(url, 60_000); // cache 60s
  return data;
}

module.exports = {
  getEventDetails,
  getTeamInfo
};
