import debug from '../debug';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

const query = new URLSearchParams(window.location.search);

class PersistenceManager {
  private readonly enabled = query.get('p') != '0';
  private readonly hash: URLSearchParams;

  constructor() {
    const temp = window.location.hash.substr(1);
    this.hash = new URLSearchParams(temp ? atob(temp) : '');
  }

  manage(id: string, stream: Observable<any>, text: () => string) {
    if (this.enabled) {
      stream.pipe(map(text)).subscribe(text => {
        this.updateHash(id, text);
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

    document.location.hash = btoa(this.hash.toString());
  };
}

export const persistenceManager = new PersistenceManager();
debug('persistenceManager', persistenceManager);
