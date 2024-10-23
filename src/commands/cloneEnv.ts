import path from 'node:path';

import { getConfigFilePath } from '../lib/commonUtils';
import { createCommandModule } from '../lib/createCommandModule';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy, createDirectoryIfNotExists } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { createValidateMetadataFileChecker } from '../lib/metadataFile';

const cloneEnvCommandModule = createCommandModule({
  command: 'clone-env <fromEnvName> <toEnvName>',
  aliases: ['clone'],
  describe: 'Clone an environment',
  builder: async (yargs) =>
    yargs
      .positional('from-env-name', {
        type: 'string',
        description: 'Name of the environment to clone from',
        demandOption: true,
        choices:
          (yargs.parsed && (await getEnvs(yargs.parsed.argv))) || undefined,
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
      .check(createValidateMetadataFileChecker()),
  handler: async ({ overrideExisting, fromEnvName, toEnvName, ...args }) => {
    await forEachEnvFile(
      async ({ configDirPath }) => {
        const configFilePath = configDirPath;
        const newConfigFilePath = await getConfigFilePath(
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
