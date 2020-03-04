import multirange from 'multirange';
import 'multirange/multirange.css';

import { Input } from './input';

export class RangeInput extends Input<[number, number]> {
  constructor(
    readonly id: string,
    defaultText: string,
    { disabled = false, persistent = true } = {}
  ) {
    super(id, defaultText, {
      disabled,
      persistent,
      parse: str => {
        const [min, max] = str.split(/\s*,\s*/);
        return [parseInt(min), parseInt(max)];
      },
      stringify: ([min, max]) => {
        return `${min},${max}`;
      }
    });
  }

  protected _setup = () => {
    const input = this.el.querySelector<MultirangeHTMLInputElement>('input');
    input.disabled = this.disabled;
    multirange(input);
    const minEl = this.el.querySelector<HTMLElement>('.min');
    const maxEl = this.el.querySelector<HTMLElement>('.max');

    input.onchange = () => {
      this.value = [+input.valueLow, +input.valueHigh];
    };

    this.el.querySelector<HTMLInputElement>(
      'input.ghost'
    ).oninput = input.oninput = () => {
      minEl.innerText = input.valueLow.toString();
      maxEl.innerText = input.valueHigh.toString();
    };

    this.stream.subscribe(({ newValue }) => {
      input.value = this.stringify(newValue);
      minEl.innerText = input.valueLow.toString();
      maxEl.innerText = input.valueHigh.toString();
    });
  };
}
