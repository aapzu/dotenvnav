import { resolve } from 'node:path';

import { getConfigDirectoryWithEnv } from '../lib/commonUtils';
import { createCommandModule } from '../lib/createCommandModule';
import {
  copy,
  createDirectoryIfNotExists,
  getFiles,
  runActionWithBackup,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';
import { checkEnv } from '../lib/validators';

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
      .middleware(validateMetadataFile)
      .check((argv) =>
        checkEnv(
          argv['from-env-name'],
          argv['config-root'],
          argv['project-root'],
        ),
      ),
  handler: async (args) => {
    const { fromEnvName, toEnvName, overrideExisting } = args;

    const fromPath = getConfigDirectoryWithEnv({
      ...args,
      envName: fromEnvName,
    });
    const toPath = getConfigDirectoryWithEnv({
      ...args,
      envName: toEnvName,
    });

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
