import path from 'node:path';

import {
  getConfigDirectoryWithEnv,
  getConfigFilePath,
} from '../lib/commonUtils';
import { createCommandModule } from '../lib/createCommandModule';
import {
  createDirectoryIfNotExists,
  move,
  runActionWithBackup,
  symlinkExists,
} from '../lib/fsUtils';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import { upsertMetadataFile, validateMetadataFile } from '../lib/metadataFile';
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
      })
      .middleware((args) =>
        validateMetadataFile({
          ...args,
          allowNotExists: true,
        }),
      ),
  handler: async (args) => {
    const { configRoot, overrideExisting, envName, projectRoot, alwaysYes } =
      args;

    logger.info(
      `Initializing config directory in ${path.join(configRoot, envName)}`,
    );

    await createDirectoryIfNotExists(getConfigDirectoryWithEnv(args));

    const envFiles = await getEnvFiles(args);

    await upsertMetadataFile(args);

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
      const toPath = getConfigFilePath(f.dotenvnavFileName, args);
      return `${fromPath} -> ${toPath}`;
    })
    .join('\n  ')}`,
    );

    logger.info('Do you want to continue? (y/n)');

    const answer = alwaysYes || (await askOnce()).toLowerCase() === 'y';

    if (!answer) {
      logger.info('Aborting');
      return;
    }

    logger.info(`Moving ${envFiles.length} config files to the config dir`);

    await runActionWithBackup(
      async () => {
        for (const { projectPath, dotenvnavFileName } of envFiles) {
          const relativeProjectFilePath = path.join(
            path.basename(projectRoot),
            path.relative(projectRoot, projectPath),
          );

          const configFilePath = getConfigFilePath(dotenvnavFileName, {
            configRoot,
            projectRoot,
            envName,
          });

          if (await symlinkExists(projectPath)) {
            logger.info(
              `${relativeProjectFilePath} is already symlinked, skipping`,
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
