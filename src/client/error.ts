import { pp } from '../core/pp';

export const error = (err: any) => {
    if (err instanceof Error) {
        alert(`Error:
${err.message}

${err.stack}`);
    } else {
        alert(`Error:
${pp(err)}`);
    }
};
