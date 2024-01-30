import { copy, resolvePath, runActionWithBackup } from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { TRootOptions } from '../types';
import { getEnvFiles } from '../lib/getEnvFiles';

type TRestoreOpts = TRootOptions & {
  envName: string;
};

export const restore = async (opts: TRestoreOpts) => {
  const { configRoot, envName } = opts;

  logger.info(`Restoring config files for environment ${envName}`);

  const envFiles = await getEnvFiles(opts);

  await runActionWithBackup(
    async () => {
      for (const { dotenvnavFileName, projectPath } of envFiles) {
        const configFileAbsolutePath = resolvePath(
          configRoot,
          envName,
          dotenvnavFileName,
        );

        await copy(configFileAbsolutePath, projectPath, {
          overrideExisting: true,
        });
      }
    },
    envFiles.map(({ projectPath }) => projectPath),
  );
};
