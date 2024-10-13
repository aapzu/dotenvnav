import path from 'node:path';

import type { commonYargs } from '../cli';
import { getConfigFilePath } from '../lib/commonUtils';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy, createDirectoryIfNotExists } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { interactiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';
import { createEnvChecker } from '../lib/validators';

const cloneEnvCommandModule = interactiveCommandModule<typeof commonYargs>()({
  command: 'clone-env <from-env-name> <to-env-name>',
  aliases: ['clone'],
  describe: 'Clone an environment',
  builder: async (yargs) => {
    const envs = await getEnvs(await yargs.argv);
    return yargs
      .positional('from-env-name', {
        type: 'string',
        description: 'Name of the environment to clone from',
        demandOption: true,
        choices: envs,
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
      .check(createEnvChecker('from-env-name'));
  },
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
