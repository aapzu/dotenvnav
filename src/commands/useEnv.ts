import { resolve } from 'node:path';

import { createCommandModule } from '../lib/createCommandModule';
import { createSymlink, runActionWithBackup } from '../lib/fsUtils';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
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
      .check((argv) => checkEnv(argv['env-name'], argv['config-root'])),
  handler: async (opts) => {
    const envFiles = await getEnvFiles(opts);

    logger.info(`Using ${opts.envName} env`);

    await runActionWithBackup(
      async () => {
        for (const { dotenvnavFileName, projectPath } of envFiles) {
          const configFileAbsolutePath = resolve(
            opts.configRoot,
            opts.envName,
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

export default useEnvCommandModule;
