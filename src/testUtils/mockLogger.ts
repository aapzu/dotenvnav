import log from 'loglevel';

export const createMockLogger = () => {
  const logStrings = {
    debug: '',
    info: '',
    warn: '',
    error: '',
  };

  const createConcatener =
    (logType: keyof typeof logStrings) =>
    (...args: unknown[]) => {
      logStrings[logType] += '\n';
      logStrings[logType] += args.join(' ');
    };

  vi.spyOn(log, 'debug').mockImplementation(createConcatener('debug'));

  vi.spyOn(log, 'info').mockImplementation(createConcatener('info'));

  vi.spyOn(log, 'warn').mockImplementation(createConcatener('warn'));

  vi.spyOn(log, 'error').mockImplementation(createConcatener('error'));

  const resetLogger = () => {
    logStrings.debug = '';
    logStrings.info = '';
    logStrings.warn = '';
    logStrings.error = '';
  };

  const getLogs = () => logStrings;

  return {
    resetLogger,
    getLogs,
  };
};
