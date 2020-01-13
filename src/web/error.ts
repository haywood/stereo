import { pp } from '../pp';

export const error = (err: any): void => {
  if (err instanceof Error) {
    console.error(err);
  } else {
    console.error(pp(err));
  }
};
