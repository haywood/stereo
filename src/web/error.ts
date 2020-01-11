import { pp } from '../core/pp';
import * as log from 'loglevel';

export const error = (err: any): void => {
  if (err instanceof Error) {
    log.error(err);
  } else {
    log.error(pp(err));
  }
};
