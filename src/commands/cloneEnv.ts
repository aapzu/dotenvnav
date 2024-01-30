import {
  copy,
  createIfNotExists,
  getFiles,
  resolvePath,
  runActionWithBackup,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { TRootOptions } from '../types';

type TCloneEnvOpts = Omit<TRootOptions, 'projectRoot'> & {
  fromEnvName: string;
  toEnvName: string;
  overrideExisting: boolean;
};

export const cloneEnv = async ({
  configRoot,
  fromEnvName,
  toEnvName,
  overrideExisting,
}: TCloneEnvOpts) => {
  const absoluteFrom = resolvePath(configRoot, fromEnvName);
  const absoluteTo = resolvePath(configRoot, toEnvName);

  logger.info(`Cloning environment ${fromEnvName} to ${toEnvName}`);

  await createIfNotExists(absoluteTo);

  const files = await getFiles(absoluteFrom);

  await runActionWithBackup(async () => {
    for (const file of files) {
      const configFileAbsolutePath = resolvePath(absoluteFrom, file);
      const newConfigFileAbsolutePath = resolvePath(absoluteTo, file);

      const commonOpts = { overrideExisting, backup: false };

      await copy(configFileAbsolutePath, newConfigFileAbsolutePath, {
        ...commonOpts,
      });
    }
  }, files);

  logger.info('Environment cloned');
};
