import { createCommandModule } from '../lib/createCommandModule';
import {
  createSymlink,
  resolvePath,
  runActionWithBackup,
} from '../lib/fsUtils';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import { checkEnv } from '../lib/validators';

const useEnvCommand = createCommandModule({
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
      .check((argv) => checkEnv(argv['env-name'], argv['config-root'])),
  handler: async (opts) => {
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
  },
});

export default useEnvCommand;
