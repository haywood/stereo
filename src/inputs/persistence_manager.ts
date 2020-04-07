import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import debug from '../debug';

const query = new URLSearchParams(window.location.search);

class PersistenceManager {
  private readonly enabled = query.get('p') != '0';
  private hash: URLSearchParams;

  constructor() {
    this.resetHash();
  }

  manage(
    id: string,
    stream: Observable<any>,
    textFn: () => string,
    onHashChange: (text: string) => void
  ) {
    const outOfSync = () => textFn() != this.hash.get(id);

    if (this.enabled) {
      stream.pipe(map(textFn)).subscribe(text => {
        if (outOfSync()) {
          this.updateHash(id, text);
        }
      });

      window.addEventListener('hashchange', () => {
        this.resetHash();

        if (outOfSync()) {
          onHashChange(this.hash.get(id));
        }
      });
    }
  }

  get(id: string, fallback: string) {
    if (this.enabled && this.hash.has(id)) {
      return this.hash.get(id);
    } else {
      return fallback;
    }
  }

  private updateHash = (id: string, text: string) => {
    if (text) {
      this.hash.set(id, text);
    } else {
      this.hash.delete(id);
    }

    window.location.hash = btoa(this.hash.toString());
  };

  private resetHash() {
    const temp = window.location.hash.substr(1);
    this.hash = new URLSearchParams(temp ? atob(temp) : '');
  }
}

export const persistenceManager = new PersistenceManager();
debug('persistenceManager', persistenceManager);
