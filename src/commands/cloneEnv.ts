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
import { validateMetadataFile } from '../lib/metadataFile';

const cloneEnvCommandModule = createCommandModule({
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
  handler: async (args) => {
    await validateMetadataFile(args);

    const { configRoot, fromEnvName, toEnvName, overrideExisting } = args;

    const fromPath = resolve(configRoot, fromEnvName);
    const toPath = resolve(configRoot, toEnvName);

    logger.info(`Cloning environment ${fromEnvName} to ${toEnvName}`);

    await createDirectoryIfNotExists(toPath);

    const files = await getFiles(fromPath);

    await runActionWithBackup(async () => {
      for (const file of files) {
        const configFilePath = resolve(fromPath, file);
        const newConfigFilePath = resolve(toPath, file);

        await copy(configFilePath, newConfigFilePath, {
          overrideExisting,
        });
      }
    }, files);

    logger.info('Environment cloned');
  },
});

export default cloneEnvCommandModule;
