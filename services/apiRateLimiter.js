const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  reservoir: 100,             // Nombre de requêtes autorisées
  reservoirRefreshAmount: 100, // Nombre de requêtes rechargées
  reservoirRefreshInterval: 60 * 1000, // Intervalle de rafraîchissement en ms (ici 60 secondes)
  minTime: 600                // Temps minimum entre deux requêtes (en ms)
});

async function fetchData(url) {
  try {
    // Utiliser le rate limiter pour planifier l'appel
    const response = await limiter.schedule(() => axios.get(url));
    return response.data;
  } catch (error) {
    throw error;
  }
}
