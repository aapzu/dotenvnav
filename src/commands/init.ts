import path from 'node:path';

import {
  createIfNotExists,
  move,
  resolvePath,
  runActionWithBackup,
  symlinkExists,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { createCommandModule } from '../lib/createCommandModule';
import { getEnvFiles } from '../lib/getEnvFiles';

import useEnvModule from './useEnv';

const initCommand = createCommandModule({
  aliases: ['i'],
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
  command: 'init [env-name]',
  deprecated: false,
  describe: 'Initialize env variable links into a new directory',
  handler: async (opts) => {
    const { configRoot, overrideExisting, envName } = opts;

    logger.info('Initializing a new config dir');
    await createIfNotExists(configRoot);
    await createIfNotExists(path.join(configRoot, envName));

    const envFiles = await getEnvFiles(opts);

    logger.info('Moving config files to the config dir');

    await runActionWithBackup(
      async () => {
        for (const { projectPath, dotenvnavFileName } of envFiles) {
          const configFileAbsolutePath = resolvePath(
            configRoot,
            envName,
            dotenvnavFileName,
          );

          if (await symlinkExists(projectPath)) {
            logger.info(`${projectPath} is already symlinked, skipping`);
            continue;
          }

          await move(projectPath, configFileAbsolutePath, {
            overrideExisting,
          });
        }
      },
      envFiles.map(({ projectPath }) => projectPath),
    );

    await useEnvModule.handler(opts);
  },
});

export default initCommand;
