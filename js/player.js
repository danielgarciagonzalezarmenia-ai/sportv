/* ============================================================================
   SPORTV — Lógica del reproductor (player.html)
   Lee ?id=, encuentra el evento y reproduce su embed en el iframe.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const requestedId = parseInt(params.get('id'), 10);

  const frame = document.getElementById('liveFrame');
  const title = document.getElementById('playerTitle');
  const status = document.getElementById('playerStatus');
  const related = document.getElementById('relatedGrid');
  const fallbackImg = 'img/placeholder.svg';

  Store.list().then((events) => {
    const current = events.find((e) => e.id === requestedId) || events[0];
    if (!current) throw new Error('Sin eventos');

    frame.src = current.embed;
    title.textContent = current.title;
    status.textContent = current.status || 'EN VIVO';
    document.title = `${current.title} — Sportv`;

    const others = events.filter((e) => e.id !== current.id);
    related.innerHTML = others.length
      ? others.map((e) => {
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
        }).join('')
      : '<div class="grid__empty">No hay otros eventos por ahora.</div>';
  }).catch((err) => {
    console.error(err);
    title.textContent = 'Evento no disponible';
    related.innerHTML = '<div class="grid__empty"><strong>No se pudo cargar el evento.</strong></div>';
  });
});