const timeoutMs = 1000;

export class CursorManager {
  private ts = Date.now();
  private acb: () => void;
  private icb: () => void;

  constructor() {
    document.onclick = this.onCursorActive;
    document.onmousemove = this.onCursorActive;
  }

  onActive(acb: () => void) {
    this.acb = acb;
  }

  onInActive(icb: () => void) {
    this.icb = icb;
  }

  private readonly onCursorActive = () {
    if (document.body.classList.contains('cursor-inactive')) {
      document.body.classList.remove('cursor-inactive');
    }

    this.ts = Date.now();
    setTimeout(this.onCursorInActive, timeoutMs);

    this.acb();
  }

  private readonly onCursorInActive = () => {
    if (Date.now() < this.ts + timeoutMs) return;
    document.body.classList.add('cursor-inactive');

    this.icb();
  }
}

export const cursorManager = new CursorManager();
