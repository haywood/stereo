import multirange from 'multirange';
import { Input } from './input';

export class RangeInput extends Input<[number, number]> {
  constructor(
    readonly id: string,
    _value: [number, number],
    { disabled = false, persistent = true } = {},
  ) {
    super(id, _value, {
      disabled,
      persistent,
      stringify: ([min, max]) => {
        return `${min},${max}`;
      },
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
      'input.ghost',
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

  protected parse(str: string): [number, number] {
    const [min, max] = str.split(/,/);
    return [parseInt(min), parseInt(max)];
  }
}
