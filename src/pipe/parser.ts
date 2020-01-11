import { PipeNode, Scalar } from './ast';
import { parse } from './grammar.pegjs';

export class Parser {
  static parsePipe = (pipe: string): PipeNode => parse(pipe);

  static parseScalar = (expr: string): Scalar =>
    parse(expr, { startRule: 'scalar' });
}
