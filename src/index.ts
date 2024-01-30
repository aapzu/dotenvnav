#!/usr/bin/env node

import yargs from 'yargs';
import log from 'loglevel';

import { resolvePath } from './lib/fsUtils';
import initCommand from './commands/init';
import restoreCommand from './commands/restore';
import useEnvCommand from './commands/useEnv';
import cloneEnvCommand from './commands/cloneEnv';
import listEnvsCommand from './commands/listEnvs';
import listEnvFilesCommand from './commands/listEnvFiles';

log.setLevel('INFO');

const yargsArgv = await yargs(process.argv.slice(2))
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
    coerce: (path) => resolvePath(path),
  })
  .option('env-file-name', {
    alias: 'f',
    type: 'string',
    array: true,
    description: 'Name of the env file',
    default: '.env.local',
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
  });

export type TRootOptions = typeof yargsArgv extends yargs.Argv<infer T>
  ? T
  : never;

yargsArgv
  .command(initCommand)
  .command(restoreCommand)
  .command(cloneEnvCommand)
  .command(listEnvsCommand)
  .command(listEnvFilesCommand)
  .command(useEnvCommand)
  .strict()
  .demandCommand()
  .version(false)
  .help()
  .parse();
