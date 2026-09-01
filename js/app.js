/* ============================================================================
   SPORTV — Lógica de la portada (index.html)
   Carga los eventos desde el store, dibuja la grilla y maneja la búsqueda.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('eventGrid');
  const count = document.getElementById('eventCount');
  const search = document.getElementById('searchInput');

  const fallbackImg = 'img/placeholder.svg';
  const showEmpty = (msg) => {
    grid.innerHTML = `<div class="grid__empty"><strong>${msg}</strong></div>`;
  };

  // Dibuja una lista de eventos en la grilla (aplica el filtro de búsqueda).
  const render = (events, query = '') => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? events.filter(e => (e.title + ' ' + (e.category || '')).toLowerCase().includes(q))
      : events;

    count.textContent = filtered.length === 1
      ? '1 evento'
      : `${filtered.length} eventos`;

    if (!filtered.length) {
      showEmpty(q ? 'Sin resultados para tu búsqueda.' : 'No hay eventos disponibles.');
      return;
    }

    grid.innerHTML = filtered.map(e => {
      const isLive = /en vivo|live|directo/i.test(e.status || '');
      const statusClass = isLive ? 'event__status--live' : '';
      const img = e.image || fallbackImg;
      return `
        <a class="event" href="player.html?id=${e.id}">
          <div class="event__thumb">
            <img src="${img}" alt="${e.title}" loading="lazy" onerror="this.src='${fallbackImg}'">
            <span class="event__status ${statusClass}">${e.status || 'HOY'}</span>
          </div>
          <div class="event__body">
            <p class="event__category">${e.category || 'Deportes'}</p>
            <h3 class="event__title">${e.title}</h3>
          </div>
        </a>
      `;
    }).join('');
  };

  // Carga inicial.
  Store.list()
    .then(events => {
      render(events);
      search.addEventListener('input', () => render(events, search.value));
    })
    .catch(err => {
      console.error(err);
      showEmpty(FIREBASE.apiKey
        ? 'No se pudo conectar con Firestore. Intenta recargar.'
        : 'Configura Firebase en js/config.js (ver GUIA-ADMIN.md).');
    });
});