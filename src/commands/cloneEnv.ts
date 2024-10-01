import path from 'node:path';

import { getConfigFilePath } from '../lib/commonUtils';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy, createDirectoryIfNotExists } from '../lib/fsUtils';
import { createCommandModule } from '../lib/interactiveCommandModule';
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
  handler: async ({ overrideExisting, fromEnvName, toEnvName, ...args }) => {
    await forEachEnvFile(
      async ({ configDirPath }) => {
        const configFilePath = configDirPath;
        const newConfigFilePath = getConfigFilePath(
          path.basename(configDirPath),
          { ...args, envName: toEnvName },
        );

        await createDirectoryIfNotExists(path.dirname(newConfigFilePath));

        await copy(configFilePath, newConfigFilePath, { overrideExisting });
      },
      { ...args, envName: fromEnvName },
    );

    logger.info('Environment cloned');
  },
});

export default cloneEnvCommandModule;
