import { pp } from '../core/pp';
import * as log from 'loglevel';

export const error = async (err: any) => {
    if (err instanceof Error) {
        log.error(err);
    } else {
        log.error(pp(err));
    }
};
