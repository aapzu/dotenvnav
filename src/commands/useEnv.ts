import { createCommandModule } from '../lib/createCommandModule';
import { createSymlink, runActionWithBackup } from '../lib/fsUtils';
import { getEnvFilesFromConfigDir } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';
import { checkEnv } from '../lib/validators';

const useEnvCommandModule = createCommandModule({
  command: 'use-env <env-name>',
  aliases: ['env <envName>', 'use <envName>'],
  describe: 'Use an environment',
  builder: (yargs) =>
    yargs
      .positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
      })
      .middleware(validateMetadataFile)
      .check((argv) =>
        checkEnv(argv['env-name'], argv['config-root'], argv['project-root']),
      ),
  handler: async ({ envName, configRoot, projectRoot, envFileName }) => {
    const envFiles = await getEnvFilesFromConfigDir({
      envName,
      configRoot,
      projectRoot,
      envFileName,
    });

    logger.info(`Using ${envName} env`);

    await runActionWithBackup(
      async () => {
        await Promise.all(
          envFiles.map(({ configDirPath, projectPath }) =>
            createSymlink(configDirPath, projectPath, {
              overrideExisting: true,
            }),
          ),
        );
      },
      envFiles.map(({ projectPath }) => projectPath),
    );
  },
});

export default useEnvCommandModule;
