import yargs, { Argv } from 'yargs';
import log from 'loglevel';

import initCommandModule from './commands/init';
import restoreCommandModule from './commands/restore';
import useEnvCommandModule from './commands/useEnv';
import cloneEnvCommandModule from './commands/cloneEnv';
import listEnvsCommandModule from './commands/listEnvs';
import listEnvFilesCommandModule from './commands/listEnvFiles';

log.setLevel('INFO');

const commonYargs = yargs(process.argv.slice(2))
  .option('project-root', {
    alias: 'r',
    type: 'string',
    description: 'Path to the root directory of your project',
    normalize: true,
    default: process.cwd(),
  })
  .option('config-root', {
    alias: 'c',
    type: 'string',
    description: 'Path to the config root directory',
    default: '~/.dotenvnav',
    normalize: true,
  })
  .option('env-file-name', {
    alias: 'f',
    type: 'string',
    array: true,
    description: 'Name of the env file',
    default: ['.env', '.env.local'],
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Verbose',
    default: false,
  })
  .middleware((argv) => {
    if (argv['verbose']) {
      log.setLevel('DEBUG');
    }
    if (argv['dry-run']) {
      process.env.DRY_RUN = 'true';
    }
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
  .help();

export type TCommonOptions = typeof commonYargs extends Argv<infer T>
  ? T
  : never;
