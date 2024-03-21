import path, { resolve } from 'node:path';

import {
  createDirectoryIfNotExists,
  move,
  runActionWithBackup,
  symlinkExists,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { createCommandModule } from '../lib/createCommandModule';
import { getEnvFiles } from '../lib/getEnvFiles';
import { createMetadataFile } from '../lib/metadataFile';

import useEnvModule from './useEnv';

const initCommandModule = createCommandModule({
  command: 'init [env-name]',
  aliases: ['i'],
  describe: 'Initialize env variable links into a new directory',
  builder: (yargs) =>
    yargs
      .option('override-existing', {
        alias: 'o',
        type: 'boolean',
        description: 'Override existing symlinks',
        default: false,
      })
      .positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
      }),
  handler: async (opts) => {
    const { configRoot, overrideExisting, envName } = opts;
    logger.info('Initializing a new config dir');
    await createDirectoryIfNotExists(configRoot);
    await createMetadataFile(opts);
    await createDirectoryIfNotExists(path.join(configRoot, envName));

    const envFiles = await getEnvFiles(opts);

    logger.info('Moving config files to the config dir');

    await runActionWithBackup(
      async () => {
        for (const { projectPath, dotenvnavFileName } of envFiles) {
          const configFilePath = resolve(
            configRoot,
            envName,
            dotenvnavFileName,
          );

          if (await symlinkExists(projectPath)) {
            logger.info(`${projectPath} is already symlinked, skipping`);
            continue;
          }

          await move(projectPath, configFilePath, {
            overrideExisting,
          });
        }
      },
      envFiles.map(({ projectPath }) => projectPath),
    );

    await useEnvModule.handler(opts);
  },
});

export default initCommandModule;
