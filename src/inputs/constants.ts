import debug from '../debug';

const query = new URLSearchParams(window.location.search);

export const persistenceEnabled = query.get('p') != '0';

export const hash = (() => {
  const temp = window.location.hash.substr(1);
  return new URLSearchParams(temp ? atob(temp) : '');
})();

debug('hash', hash);
