import { Context } from './context';

export abstract class State {
  readonly tokens: string[] = [];
  readonly values: any[] = [];

  abstract apply(stream, ctx: Context);
  abstract evaluate(ctx?: Context, stream?): any;
  abstract clone(): State;

  toString() {
    return `${this.constructor.name}`;
  }
}
