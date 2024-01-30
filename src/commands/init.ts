import path from 'node:path';

import {
  createIfNotExists,
  move,
  resolvePath,
  runActionWithBackup,
  symlinkExists,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { TRootOptions } from '../types';
import { getEnvFiles } from '../lib/getEnvFiles';

import { useEnv } from './useEnv';

type TInitOpts = TRootOptions & {
  overrideExisting?: boolean;
  envName: string;
};

export const init = async (opts: TInitOpts) => {
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

  await useEnv(opts);
};
