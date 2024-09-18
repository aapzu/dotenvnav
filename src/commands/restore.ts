import { resolve } from 'node:path';

import { createCommandModule } from '../lib/createCommandModule';
import { copy, runActionWithBackup } from '../lib/fsUtils';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const restoreCommandModule = createCommandModule({
  command: 'restore [env-name]',
  describe: 'Restore env variables from a directory',
  builder: (yargs) =>
    yargs
      .positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
      })
      .middleware(validateMetadataFile),
  handler: async (args) => {
    const { configRoot, envName } = args;

    logger.info(`Restoring config files for environment ${envName}`);

    const envFiles = await getEnvFiles(args);

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
