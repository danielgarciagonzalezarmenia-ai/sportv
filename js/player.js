/* ============================================================================
   SPORTV — Lógica del reproductor (player.html)
   Lee ?id=, encuentra el evento y:
     - PROXIMO (faltan >5 min): pantalla de cuenta regresiva HH:MM:SS.
     - EN VIVO (dentro de la ventana): muestra el reproductor si hay embed.
       Si no hay URL o la hay pero no carga: pantalla "sin transmisión".
     - FINALIZADO: pantalla "el evento ya finalizó".
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const requestedId = parseInt(params.get('id'), 10);

  const frame = document.getElementById('liveFrame');
  const video = document.getElementById('liveVideo');
  const stageCover = document.getElementById('stageCover');
  const coverCountdown = document.getElementById('coverCountdown');
  const coverMessage = document.getElementById('coverMessage');
  const countdownEl = document.getElementById('countdown');
  const coverTitle = document.getElementById('coverTitle');
  const coverText = document.getElementById('coverText');
  const coverMeta = document.getElementById('coverMeta');

  const titleEl = document.getElementById('playerTitle');
  const statusEl = document.getElementById('playerStatus');
  const hintEl = document.getElementById('playerHint');
  const related = document.getElementById('relatedGrid');
  const fallbackImg = 'img/placeholder.svg';

  let current = null;
  let timer = null;
  let lastSrc = '';
  let videoSrc = '';
  let hls = null;

  const isHLS = (u) => /\.m3u8(\?|$)/i.test(u);

  // ---------- Ayudas visuales ----------
  function setStatus(status) {
    statusEl.textContent = status;
    statusEl.className = 'player__status ' + (status === 'EN VIVO' ? 'is-live' : '');
  }

  function stopStream() {
    clearInterval(timer);
    if (hls) {
      try { hls.destroy(); } catch (e) {}
      hls = null;
    }
    if (video) {
      if (video.pause) video.pause();
      video.removeAttribute('src');
      video.style.display = 'none';
    }
    if (frame) frame.style.display = 'none';
  }

  // ---------- Reproducción por tipo ----------
  function playHLS(src) {
    // No reiniciar si el mismo stream ya está visible (evita reinicios en render()).
    if (video.style.display !== 'none' && videoSrc === src) {
      stageCover.hidden = true;
      return;
    }
    stopStream();
    videoSrc = src;
    frame.style.display = 'none';
    stageCover.hidden = true;
    video.hidden = false;
    video.style.display = '';
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    hintEl.textContent = 'Reproduciendo en vivo. Pulsa el icono de sonido del reproductor para activar el audio.';

    const onFatal = () => {
      showMessage('Sin transmisión disponible', 'No se encontraron transmisiones para este partido.');
    };

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls({ autoStartLoad: true, enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_ev, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad(); // reintenta la red
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            onFatal();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().catch(() => {});
      video.addEventListener('error', () => onFatal(), { once: true });
    } else {
      showMessage('Sin transmisión disponible', 'Tu navegador no soporta reproducción HLS.');
    }
  }

  function playIframe(src) {
    stopStream();
    if (src !== lastSrc) {
      frame.src = src;
      lastSrc = src;
    }
    video.style.display = 'none';
    stageCover.hidden = true;
    frame.style.display = '';
    hintEl.textContent = 'Si la transmisión no se ve, la calidad varía según el origen del canal.';
  }

  function showFrame(src) {
    isHLS(src) ? playHLS(src) : playIframe(src);
  }

  function showMessage(title, text) {
    stopStream();
    coverCountdown.hidden = true;
    coverMessage.hidden = false;
    coverTitle.textContent = title;
    coverText.textContent = text;
    stageCover.hidden = false;
  }

  function showCountdown(target) {
    stopStream();
    coverMessage.hidden = true;
    coverCountdown.hidden = false;
    stageCover.hidden = false;

    hintEl.textContent = 'El evento aún no ha comenzado. Se mostrará automáticamente la transmisión.';
    const update = () => {
      const remaining = (target - Date.now());
      if (remaining <= 0) { render(); return; }
      countdownEl.textContent = formatHMS(remaining);
    };
    update();
    timer = setInterval(update, 1000);
  }

  // ---------- Estado ----------
  function showLiveOrNoStream() {
    if (current.embed && current.embed.trim()) {
      showFrame(current.embed.trim());
    } else {
      showMessage('Sin transmisión disponible', 'No se encontraron transmisiones para este partido.');
    }
  }

  function render() {
    if (!current) return;
    const st = stateOf(current);

    // Sin hora de inicio: depende del estado manual configurado.
    if (!st.hasStart) {
      clearInterval(timer);
      if (st.status === 'FINALIZADO') {
        setStatus('FINALIZADO');
        showMessage('Evento finalizado', 'El evento ya finalizó. Gracias por acompañarnos.');
      } else {
        setStatus(st.status);
        showLiveOrNoStream();
      }
      return;
    }

    // Con hora de inicio: auto-cálculo.
    if (st.finished) {
      clearInterval(timer);
      setStatus('FINALIZADO');
      showMessage('Evento finalizado', 'El evento ya finalizó. Gracias por acompañarnos.');
      return;
    }

    if (!st.atLive) {
      setStatus('PROXIMO');
      // Se muestra el reproductor desde PRE_ROLL_MS antes del inicio.
      showCountdown(st.start - SPORTV_CONFIG.PRE_ROLL_MS);
      return;
    }

    // Ventana en vivo: reproductor o pantalla "sin transmisión".
    setStatus('EN VIVO');
    clearInterval(timer);
    showLiveOrNoStream();
  }

  // ---------- Inicio ----------
  Store.list()
    .then((events) => {
      const item = events.find((e) => e.id === requestedId) || events[0];
      if (!item) throw new Error('Sin eventos');

      current = item;
      titleEl.textContent = item.title;
      document.title = `${item.title} — Sportv`;
      coverMeta.textContent = item.start ? formatLocal(Number(item.start)) : '';

      render();

      // Revisa cada 30 s por si el estado cambia (paso a EN VIVO / FINALIZADO).
      setInterval(render, 30000);

      // Eventos relacionados.
      const others = events.filter((e) => e.id !== current.id);
      related.innerHTML = others.length
        ? others.map((e) => {
            const s2 = stateOf(e);
            const statusClass2 = s2.status === 'EN VIVO' ? 'event__status--live' : (s2.status === 'FINALIZADO' ? 'event__status--off' : '');
            const img = e.image || fallbackImg;
            return `
              <a class="event" href="player.html?id=${e.id}">
                <div class="event__thumb">
                  <img src="${img}" alt="${e.title}" loading="lazy" onerror="this.src='${fallbackImg}'">
                  <span class="event__status ${statusClass2}">${s2.status}</span>
                </div>
                <div class="event__body">
                  <p class="event__category">${e.category || 'Deportes'}</p>
                  <h3 class="event__title">${e.title}</h3>
                </div>
              </a>
            `;
          }).join('')
        : '<div class="grid__empty">No hay otros eventos por ahora.</div>';
    })
    .catch((err) => {
      console.error(err);
      titleEl.textContent = 'Evento no disponible';
      showMessage('Evento no disponible', 'No se pudo cargar el evento. Intenta más tarde.');
      related.innerHTML = '<div class="grid__empty"><strong>No se pudo cargar el evento.</strong></div>';
    });
});