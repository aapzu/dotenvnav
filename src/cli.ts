import yargs, { Argv } from 'yargs';
import log from 'loglevel';

import initCommandModule from './commands/init';
import restoreCommandModule from './commands/restore';
import useEnvCommandModule from './commands/useEnv';
import cloneEnvCommandModule from './commands/cloneEnv';
import listEnvsCommandModule from './commands/listEnvs';
import listEnvFilesCommandModule from './commands/listEnvFiles';
import { TKebabCaseKeysToCamelCase } from './types';
import { normalizePath } from './lib/normalizers';
import { logger } from './lib/logger';

log.setLevel('INFO');

const commonYargs = yargs(process.argv.slice(2))
  .option('project-root', {
    alias: 'r',
    type: 'string',
    description: 'Path to the root directory of your project',
    default: process.cwd(),
    coerce: normalizePath,
  })
  .option('config-root', {
    alias: 'c',
    type: 'string',
    description: 'Path to the config root directory',
    default: '~/.dotenvnav',
    coerce: normalizePath,
  })
  .option('env-file-name', {
    alias: 'f',
    type: 'string',
    array: true,
    description: 'Name of the env file',
    default: ['.env.local'],
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Verbose',
    default: false,
  })
  .option('dry-run', {
    alias: 'd',
    type: 'boolean',
    description: 'Dry run',
    default: false,
  })
  .middleware(async (argv) => {
    if (argv['verbose']) {
      log.setLevel('DEBUG');
    }
    if (argv['dry-run']) {
      process.env.DRY_RUN = 'true';
    }
  })
  .fail((_msg, err) => {
    if (err) {
      logger.error(err.message);
    }
    process.exit(1);
  });

export const parser = commonYargs
  .command(initCommandModule)
  .command(restoreCommandModule)
  .command(cloneEnvCommandModule)
  .command(listEnvsCommandModule)
  .command(listEnvFilesCommandModule)
  .command(useEnvCommandModule)
  .strict()
  .demandCommand()
  .version(false)
  .recommendCommands()
  .help();

export type TCommonOptions = typeof commonYargs extends Argv<infer T>
  ? T
  : never;

export type TCommonOptionsCamelCase = TKebabCaseKeysToCamelCase<TCommonOptions>;
