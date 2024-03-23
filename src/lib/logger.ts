import chalk from 'chalk';
import log from 'loglevel';

export const logger = {
  info: (...msg: unknown[]) => log.info(chalk.whiteBright(...msg) + '\n'),
  warn: (...msg: unknown[]) => log.warn(chalk.yellowBright(...msg) + '\n'),
  error: (...msg: unknown[]) => log.error(chalk.redBright(...msg) + '\n'),
  debug: (...msg: unknown[]) => log.debug(chalk.gray(...msg) + '\n'),
};
