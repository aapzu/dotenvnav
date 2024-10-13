import path from 'node:path';
import enquirer from 'enquirer';
import { getConfigDirectoryWithEnv } from '../lib/commonUtils';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import {
  createDirectoryIfNotExists,
  move,
  symlinkExists,
} from '../lib/fsUtils';
import { getEnvFilesFromProjectDir } from '../lib/getEnvFiles';
import { interactiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { upsertMetadataFile, validateMetadataFile } from '../lib/metadataFile';

import type { commonYargs } from '../cli';
import { getEvenColumns } from '../lib/loggerUtils';
import useEnvModule from './useEnv';

const initCommandModule = interactiveCommandModule<typeof commonYargs>()(
  {
    command: 'init [env-name]',
    aliases: ['i'],
    describe: 'Initialize env variable links into a new directory',
    builder: async (yargs) =>
      yargs
        .option('override-existing', {
          type: 'boolean',
          description: 'Override existing symlinks',
          default: false,
        })
        .option('yes', {
          alias: 'y',
          type: 'boolean',
          description: 'Always answer yes to prompts',
          default: false,
        })
        .positional('env-name', {
          alias: 'e',
          type: 'string',
          description: 'Name of the environment',
          demandOption: true,
          default: 'default',
        })
        .middleware((args) =>
          validateMetadataFile({ ...args, allowNotExists: true }),
        ),
    handler: async (args) => {
      const { configRoot, overrideExisting, envName, projectRoot, yes } = args;

      logger.info(
        `Initializing config directory in ${path.join(configRoot, envName)}`,
      );

      await createDirectoryIfNotExists(getConfigDirectoryWithEnv(args));

      const envFiles = await getEnvFilesFromProjectDir(args);

      await upsertMetadataFile(args);

      if (envFiles.length === 0) {
        logger.info(`No env files found in ${projectRoot}, nothing to do`);
        return;
      }

      logger.info(`Looking for env files in ${projectRoot}`);

      const columns = getEvenColumns(
        envFiles.map((f) => {
          const fromPath = path.join(
            path.basename(projectRoot),
            path.relative(projectRoot, f.projectPath),
          );
          const toPath = f.configDirPath;
          return [fromPath, '->', toPath];
        }),
        2,
        2,
      );

      logger.info(`These symbolic links will be created: \n${columns}`);

      const result = await enquirer.prompt<{ confirm: boolean }>({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue?',
        skip: yes,
      });
      if (Object.keys(result).length > 0 && !result.confirm) {
        logger.info('Aborting');
        return;
      }

      logger.info(`Moving ${envFiles.length} config files to the config dir`);

      await forEachEnvFile(
        async ({ projectPath, configDirPath }) => {
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
        },
        { getEnvFilesFromProject: true, ...args },
      );

      await useEnvModule.handler(args);
    },
  },
  {
    extraInteractiveFields: ['env-name'],
  },
);

export default initCommandModule;
