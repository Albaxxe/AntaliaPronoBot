// src/services/apiRateLimiter.js
const Bottleneck = require('bottleneck');

// 100 requêtes par minute => ~1.66 req/s
// Pour être sûr de ne pas dépasser, on peut mettre un peu moins, ex: 90 req/min.
const limiter = new Bottleneck({
  reservoir: 100,             // nombre de jetons disponibles
  reservoirRefreshAmount: 100, // on réinitialise à 100
  reservoirRefreshInterval: 60 * 1000, // toutes les 60s
  minTime: 600,               // minTime en ms entre 2 requêtes => 600 ms => ~100 req/min
});

module.exports = limiter;
