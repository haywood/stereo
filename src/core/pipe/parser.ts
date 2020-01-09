import { parse } from './grammar.pegjs';
import { PipeNode, ArithNode, Scalar } from './ast';
import { pp } from '../pp';
import { getLogger } from 'loglevel';

const logger = getLogger('Parser');
logger.setDefaultLevel('info');

type Options = {
  startRule: 'arith';
};

const loggingParse: typeof parse = <T>(expr: string, options?: Options): T => {
  try {
    const node = parse(expr, options);
    logger.debug(`parsed ${expr} into node ${pp(node)}`);
    return node;
  } catch (err) {
    logger.error(
      `error parsing ${expr} at ${pp(err.location)}: ${err.message}`,
    );
    throw err;
  }
};

export class Parser {
  static parsePipe = (pipe: string): PipeNode => loggingParse(pipe);

  static parseScalar = (expr: string): Scalar =>
    loggingParse(expr, { startRule: 'arith' });
}
