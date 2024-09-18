import { getConfigFilePath } from '../lib/commonUtils';
import { createCommandModule } from '../lib/createCommandModule';
import { createSymlink, runActionWithBackup } from '../lib/fsUtils';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';
import { checkEnv } from '../lib/validators';

const useEnvCommandModule = createCommandModule({
  command: 'use-env <env-name>',
  aliases: ['env <envName>', 'use <envName>', '$0 <envName>'],
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
  handler: async (args) => {
    const { envName, configRoot, projectRoot } = args;

    const envFiles = await getEnvFiles(args);

    logger.info(`Using ${envName} env`);

    await runActionWithBackup(
      async () => {
        for (const { dotenvnavFileName, projectPath } of envFiles) {
          const configFileAbsolutePath = getConfigFilePath(dotenvnavFileName, {
            configRoot,
            projectRoot,
            envName,
          });

          await createSymlink(configFileAbsolutePath, projectPath, {
            overrideExisting: true,
          });
        }
      },
      envFiles.map(({ projectPath }) => projectPath),
    );
  },
});

export default useEnvCommandModule;
