import chalk from 'chalk';
import log from 'loglevel';

export const logger = {
  info: (...msg: unknown[]) => log.info(chalk.whiteBright(...msg)),
  warn: (...msg: unknown[]) => log.warn(chalk.yellowBright(...msg)),
  error: (...msg: unknown[]) => log.error(chalk.redBright(...msg)),
  debug: (...msg: unknown[]) => log.debug(chalk.gray(...msg)),
};
