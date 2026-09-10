/* Stato condiviso: Cloudflare D1 è la fonte principale; localStorage permette di lavorare anche offline. */
(() => {
  const prefix = 'j26-';
  const originalSet = Storage.prototype.setItem;
  let ready = false;
  let timer;
  const own = () => Object.fromEntries(Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .map(key => [key, localStorage.getItem(key)]));
  const sync = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fetch('./api/state', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: own() })
    }).catch(() => {}), 450);
  };
  Storage.prototype.setItem = function (key, value) {
    originalSet.call(this, key, value);
    if (ready && key.startsWith(prefix)) sync();
  };
  fetch('./api/state', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(({ data }) => {
      if (data) {
        Object.keys(localStorage).filter(key => key.startsWith(prefix)).forEach(key => localStorage.removeItem(key));
        Object.entries(data).forEach(([key, value]) => originalSet.call(localStorage, key, value));
        render();
      } else sync();
    })
    .catch(() => {})
    .finally(() => { ready = true; });
})();
