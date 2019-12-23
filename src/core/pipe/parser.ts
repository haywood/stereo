import { parse } from './grammar.pegjs';
import { ASTNode } from './types';
import { pp } from '../pp';
import { getLogger } from 'loglevel';

const logger = getLogger('Parser');
logger.setDefaultLevel('info');

type Options = {
    startRule: 'arith';
};

const loggingParse: typeof parse = (expr: string, options?: Options): ASTNode => {
    try {
        const node = parse(expr, options);
        logger.debug(`parsed ${expr} into node ${pp(node)}`);
        return node;
    } catch (err) {
        logger.error(`error parsing ${expr} at ${pp(err.location)}: ${err.message}`);
        throw err;
    }
};

export class Parser {
    static parsePipe = (pipe: string) => loggingParse(pipe);

    static parseArith = (expr: string) => loggingParse(expr, { startRule: 'arith' });
}
