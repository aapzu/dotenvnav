import {
  createSymlink,
  resolvePath,
  runActionWithBackup,
} from "../lib/fsUtils";
import { getEnvFiles } from "../lib/getEnvFiles";
import { logger } from "../lib/logger";
import { TRootOptions } from "../types";

type TUseEnvOpts = TRootOptions & {
  envName: string;
};

export const useEnv = async (opts: TUseEnvOpts) => {
  const { configRoot, envName } = opts;

  const envFiles = await getEnvFiles(opts);

  logger.info(`Using ${envName} env`);

  await runActionWithBackup(
    async () => {
      for (const { dotenvnavFileName, projectPath } of envFiles) {
        const configFileAbsolutePath = resolvePath(
          configRoot,
          envName,
          dotenvnavFileName,
        );

        await createSymlink(configFileAbsolutePath, projectPath, {
          overrideExisting: true,
        });
      }
    },
    envFiles.map(({ projectPath }) => projectPath),
  );
};
