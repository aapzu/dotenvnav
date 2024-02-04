import { resolve } from 'node:path';

import { copy, runActionWithBackup } from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { getEnvFiles } from '../lib/getEnvFiles';
import { createCommandModule } from '../lib/createCommandModule';

const restoreCommandModule = createCommandModule({
  command: 'restore [env-name]',
  describe: 'Restore env variables from a directory',
  builder: (yargs) =>
    yargs.positional('env-name', {
      alias: 'e',
      type: 'string',
      description: 'Name of the environment',
      default: 'default',
    }),
  handler: async (opts) => {
    const { configRoot, envName } = opts;

    logger.info(`Restoring config files for environment ${envName}`);

    const envFiles = await getEnvFiles(opts);

    await runActionWithBackup(
      async () => {
        for (const { dotenvnavFileName, projectPath } of envFiles) {
          const configFileAbsolutePath = resolve(
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
  },
});

export default restoreCommandModule;
