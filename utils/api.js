const axios = require('axios');
module.exports.getPrediction = async (match) => (await axios.get(`${process.env.API_URL}/predict?match=${encodeURIComponent(match)}`)).data;
