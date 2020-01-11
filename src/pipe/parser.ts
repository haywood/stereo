import { parse } from './grammar.pegjs';
import { PipeNode, Scalar } from './ast';

export class Parser {
  static parsePipe = (pipe: string): PipeNode => parse(pipe);

  static parseScalar = (expr: string): Scalar =>
    parse(expr, { startRule: 'scalar' });
}
