import log from 'loglevel';
import yargs from 'yargs';

import cloneEnvCommandModule from './commands/cloneEnv';
import initCommandModule from './commands/init';
import listEnvFilesCommandModule from './commands/listEnvFiles';
import listEnvsCommandModule from './commands/listEnvs';
import restoreCommandModule from './commands/restore';
import useEnvCommandModule from './commands/useEnv';
import { initInteractiveYargs } from './lib/interactiveCommandModule';
import { normalizePath } from './lib/normalizers';
import type { GetT, TKebabCaseKeysToCamelCase } from './types';

log.setLevel('INFO');

const interactiveYargs = initInteractiveYargs(yargs(process.argv.slice(2)), {
  interactiveOptionName: 'interactive',
  interactiveOptionAlias: 'i',
  defaultInteractivity: 'demanded',
});
export const commonYargs = interactiveYargs
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
  .middleware(async (argv) => {
    if (argv.verbose) {
      log.setLevel('DEBUG');
    }
    if (argv['dry-run']) {
      process.env.DRY_RUN = 'true';
    }
  }, true);

export const parser = commonYargs
  .command(listEnvsCommandModule)
  .command(initCommandModule)
  .command(restoreCommandModule)
  .command(cloneEnvCommandModule)
  .command(listEnvFilesCommandModule)
  .command(useEnvCommandModule)
  .strict()
  .demandCommand()
  .recommendCommands()
  .help();

export type TCommonOptions = GetT<typeof commonYargs>;

export type TCommonOptionsCamelCase = TKebabCaseKeysToCamelCase<TCommonOptions>;
