import type { commonYargs } from '../cli';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { interactiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const restoreCommandModule = interactiveCommandModule<typeof commonYargs>()(
  {
    command: 'restore [env-name]',
    describe: 'Restore env variables from a directory',
    builder: async (yargs) => {
      const envs = await getEnvs(await yargs.argv);
      return yargs.middleware(validateMetadataFile).positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
        choices: envs,
      });
    },
    handler: async (args) => {
      logger.info(`Restoring config files for environment ${args.envName}`);

      await forEachEnvFile(
        ({ configDirPath, projectPath }) =>
          copy(configDirPath, projectPath, { overrideExisting: true }),
        args,
      );
    },
  },
  {
    extraInteractiveFields: ['env-name'],
  },
);

export default restoreCommandModule;
