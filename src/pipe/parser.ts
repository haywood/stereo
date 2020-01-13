import grammar, { PipeNode, Scalar } from './grammar.pegjs';

export class Parser {
  static parsePipe = (pipe: string): PipeNode => grammar.parse(pipe);

  static parseScalar = (expr: string): Scalar =>
    grammar.parse(expr, { startRule: 'scalar' });
}
