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
import { createMetadataFile, validateMetadataFile } from '../lib/metadataFile';
import { askOnce } from '../lib/prompt';

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
      .option('always-yes', {
        alias: 'y',
        type: 'boolean',
        description: 'Always answer yes to prompts',
        default: false,
      })
      .positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
      }),
  handler: async (args) => {
    await validateMetadataFile({
      ...args,
      allowNotExists: true,
    });

    const envFiles = await getEnvFiles(args);

    const { configRoot, overrideExisting, envName, projectRoot, alwaysYes } =
      args;
    logger.info(
      `Initializing config directory in ${path.join(configRoot, envName)}`,
    );

    await createDirectoryIfNotExists(path.join(configRoot, envName));

    await createMetadataFile(args);

    if (envFiles.length === 0) {
      logger.info(`No env files found in ${projectRoot}, nothing to do`);
      return;
    }

    logger.info(`Looking for env files in ${projectRoot}`);

    logger.info(
      `These symbolic links will be created:
  ${envFiles
    .map((f) => {
      const fromPath = path.join(
        path.basename(projectRoot),
        path.relative(projectRoot, f.projectPath),
      );
      const toPath = path.join(configRoot, f.dotenvnavFileName);
      return `${fromPath} -> ${toPath}`;
    })
    .join('\n  ')}`,
    );

    logger.info(`Do you want to continue? (y/n)`);

    const answer = alwaysYes || (await askOnce()).toLowerCase() === 'y';

    if (!answer) {
      logger.info('Aborting');
      return;
    }

    logger.info(`Moving ${envFiles.length} config files to the config dir`);

    await runActionWithBackup(
      async () => {
        for (const { projectPath, dotenvnavFileName } of envFiles) {
          const configFilePath = resolve(
            configRoot,
            envName,
            dotenvnavFileName,
          );

          if (await symlinkExists(projectPath)) {
            logger.info(
              `${path.join(
                path.basename(projectRoot),
                path.relative(projectRoot, projectPath),
              )} is already symlinked, skipping`,
            );
            continue;
          }

          await move(projectPath, configFilePath, {
            overrideExisting,
          });
        }
      },
      envFiles.map(({ projectPath }) => projectPath),
    );

    await useEnvModule.handler(args);
  },
});

export default initCommandModule;
