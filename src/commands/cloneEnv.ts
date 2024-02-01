import { resolve } from 'node:path';

import { createCommandModule } from '../lib/createCommandModule';
import {
  copy,
  createDirectoryIfNotExists,
  getFiles,
  runActionWithBackup,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { checkEnv } from '../lib/validators';

const cloneEnvCommand = createCommandModule({
  command: 'clone-env <fromEnvName> <toEnvName>',
  aliases: ['clone'],
  describe: 'Clone an environment',
  builder: (yargs) =>
    yargs
      .positional('from-env-name', {
        type: 'string',
        description: 'Name of the environment to clone from',
        demandOption: true,
      })
      .positional('to-env-name', {
        type: 'string',
        description: 'Name of the environment to clone to',
        demandOption: true,
      })
      .option('override-existing', {
        alias: 'o',
        type: 'boolean',
        description: 'Override existing env',
        default: false,
      })
      .check((argv) => checkEnv(argv['from-env-name'], argv['config-root'])),
  handler: async ({ configRoot, fromEnvName, toEnvName, overrideExisting }) => {
    const fromPath = resolve(configRoot, fromEnvName);
    const toPath = resolve(configRoot, toEnvName);

    logger.info(`Cloning environment ${fromEnvName} to ${toEnvName}`);

    await createDirectoryIfNotExists(toPath);

    const files = await getFiles(fromPath);

    await runActionWithBackup(async () => {
      for (const file of files) {
        const configFilePath = resolve(fromPath, file);
        const newConfigFilePath = resolve(toPath, file);

        const commonOpts = { overrideExisting, backup: false };

        await copy(configFilePath, newConfigFilePath, {
          ...commonOpts,
        });
      }
    }, files);

    logger.info('Environment cloned');
  },
});

export default cloneEnvCommand;
