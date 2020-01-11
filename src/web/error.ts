import * as log from 'loglevel';

import { pp } from '../pp';

export const error = (err: any): void => {
  if (err instanceof Error) {
    log.error(err);
  } else {
    log.error(pp(err));
  }
};
