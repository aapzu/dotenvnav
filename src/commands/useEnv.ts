import { resolve } from 'node:path';

import { createCommandModule } from '../lib/createCommandModule';
import { createSymlink, runActionWithBackup } from '../lib/fsUtils';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';
import { checkEnv } from '../lib/validators';
import { validateMetadataFile } from '../lib/metadataFile';

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
  handler: async (args) => {
    await validateMetadataFile(args);

    const { envName, configRoot } = args;

    const envFiles = await getEnvFiles(args);

    logger.info(`Using ${envName} env`);

    await runActionWithBackup(
      async () => {
        for (const { dotenvnavFileName, projectPath } of envFiles) {
          const configFileAbsolutePath = resolve(
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

export default useEnvCommandModule;
