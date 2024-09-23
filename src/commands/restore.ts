import { createCommandModule } from '../lib/createCommandModule';
import { copy, runActionWithBackup } from '../lib/fsUtils';
import { getEnvFilesFromConfigDir } from '../lib/getEnvFiles';
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
  handler: async ({ configRoot, projectRoot, envName, envFileName }) => {
    logger.info(`Restoring config files for environment ${envName}`);

    const envFiles = await getEnvFilesFromConfigDir({
      configRoot,
      projectRoot,
      envName,
      envFileName,
    });

    await runActionWithBackup(
      async () => {
        await Promise.all(
          envFiles.map(async ({ configDirPath, projectPath }) => {
            await copy(configDirPath, projectPath, {
              overrideExisting: true,
            });
          }),
        );
      },
      envFiles.flatMap(({ projectPath, configDirPath }) => [
        projectPath,
        configDirPath,
      ]),
    );
  },
});

export default restoreCommandModule;
