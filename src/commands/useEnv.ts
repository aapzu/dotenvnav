import type { commonYargs } from '../cli';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { createSymlink } from '../lib/fsUtils';
import { interactiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';
import { createEnvChecker } from '../lib/validators';

const useEnvCommandModule = interactiveCommandModule<typeof commonYargs>()(
  {
    command: 'use-env <env-name>',
    aliases: ['env <env-name>', 'use <env-name>'],
    describe: 'Use an environment',
    builder: (yargs) => {
      return yargs
        .positional('env-name', {
          alias: 'e',
          type: 'string',
          description: 'Name of the environment',
          default: 'default',
        })
        .middleware(validateMetadataFile)
        .check(createEnvChecker('env-name'));
    },
    handler: async (args) => {
      logger.info(`Using ${args.envName} env`);

      await forEachEnvFile(
        ({ configDirPath, projectPath }) =>
          createSymlink(configDirPath, projectPath, {
            overrideExisting: true,
          }),
        args,
      );
    },
  },
  {
    extraInteractiveFields: ['env-name'],
  },
);

export default useEnvCommandModule;
