import path from 'node:path';

import { getConfigDirectoryWithEnv } from '../lib/commonUtils';
import { createCommandModule } from '../lib/createCommandModule';
import {
  createDirectoryIfNotExists,
  move,
  runActionWithBackup,
  symlinkExists,
} from '../lib/fsUtils';
import { getEnvFilesFromProjectDir } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import {
  createValidateMetadataFileChecker,
  upsertMetadataFile,
} from '../lib/metadataFile';

import { getEvenColumns } from '../lib/loggerUtils';
import { normalizePath } from '../lib/normalizers';
import { askOnce } from '../lib/prompt';
import useEnvModule from './useEnv';

const initCommandModule = createCommandModule({
  command: 'init [env-name]',
  aliases: ['i'],
  describe: 'Initialize env variable links into a new directory',
  builder: async (yargs) =>
    yargs
      .option('config-root', {
        alias: 'c',
        type: 'string',
        description: 'Root directory for the config files',
        default: 'config',
      })
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
      .option('config-root', {
        alias: 'c',
        type: 'string',
        description: 'Path to the config root directory',
        default: '~/.dotenvnav',
        coerce: normalizePath,
      })
      .positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
      })
      .check(createValidateMetadataFileChecker({ allowNotExists: true })),
  async handler(args) {
    const { overrideExisting, envName, projectRoot, alwaysYes, configRoot } =
      args;

    logger.info(
      `Initializing config directory in ${path.join(configRoot, envName)}`,
    );

    await createDirectoryIfNotExists(
      getConfigDirectoryWithEnv({ configRoot, projectRoot, envName }),
    );

    await upsertMetadataFile(args);

    const envFiles = await getEnvFilesFromProjectDir(args);

    if (envFiles.length === 0) {
      logger.info(`No env files found in ${projectRoot}, nothing to do`);
      return;
    }

    logger.info(`Looking for env files in ${projectRoot}`);

    logger.info(
      `These symbolic links will be created:
  ${getEvenColumns(
    envFiles.map((f) => {
      const fromPath = path.join(
        path.basename(projectRoot),
        path.relative(projectRoot, f.projectPath),
      );
      const toPath = f.configDirPath;
      return [fromPath, '->', toPath];
    }),
    2,
  )}`,
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
        await Promise.all(
          envFiles.map(async ({ projectPath, configDirPath }) => {
            const relativeProjectFilePath = path.join(
              path.basename(projectRoot),
              path.relative(projectRoot, projectPath),
            );

            if (await symlinkExists(projectPath)) {
              logger.info(
                `${relativeProjectFilePath} is already symlinked, skipping`,
              );
              return;
            }

            await move(projectPath, configDirPath, {
              overrideExisting,
            });
          }),
        );
      },
      envFiles.map(({ projectPath }) => projectPath),
    );

    await useEnvModule.handler(args);
  },
});

export default initCommandModule;
