import log from 'loglevel';
import yargs, { type Argv } from 'yargs';

import cloneEnvCommandModule from './commands/cloneEnv';
import initCommandModule from './commands/init';
import listEnvFilesCommandModule from './commands/listEnvFiles';
import listEnvsCommandModule from './commands/listEnvs';
import restoreCommandModule from './commands/restore';
import useEnvCommandModule from './commands/useEnv';
import { logger } from './lib/logger';
import { normalizePath } from './lib/normalizers';
import type { TKebabCaseKeysToCamelCase } from './types';

import type pkgJson from '../package.json';

log.setLevel('INFO');

const commonYargs = yargs(process.argv.slice(2))
  .option('project-root', {
    alias: 'r',
    type: 'string',
    description: 'Path to the root directory of your project',
    default: process.cwd(),
    coerce: normalizePath,
  })
  .option('env-file-name', {
    alias: 'f',
    type: 'string',
    array: true,
    description: 'Name of the env file',
    default: ['.env.local'],
  })
  .option('metadata-file-path', {
    alias: 'm',
    type: 'string',
    path: true,
    description: 'Path of the metadata file',
    default: '~/.dotenvnav.json',
    coerce: normalizePath,
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
  .alias('h', 'help')
  .middleware(async (argv) => {
    if (argv.verbose) {
      log.setLevel('DEBUG');
    }
    if (argv['dry-run']) {
      process.env.DRY_RUN = 'true';
    }
  })
  .fail((msg, err) => {
    if (msg) {
      logger.error(msg);
      return process.exit(1);
    }
    throw err;
  });

const scriptName: keyof (typeof pkgJson)['bin'] = 'dotenvnav';

export const parser = commonYargs
  .command(initCommandModule)
  .command(restoreCommandModule)
  .command(cloneEnvCommandModule)
  .command(listEnvsCommandModule)
  .command(listEnvFilesCommandModule)
  .command(useEnvCommandModule)
  .strict()
  .demandCommand()
  .scriptName(scriptName)
  .recommendCommands()
  .help();

export type TCommonOptions = typeof commonYargs extends Argv<infer T>
  ? T
  : never;

export type TCommonOptionsCamelCase = TKebabCaseKeysToCamelCase<TCommonOptions>;
