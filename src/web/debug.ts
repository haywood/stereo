export default (key: string, value: any) => {
    // replace the whole object so that old references
    // to it in the console are not mutated.
    window._debug = {
        ...window._debug,
        [key]: value,
    };
};
