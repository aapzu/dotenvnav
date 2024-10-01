import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { createSymlink } from '../lib/fsUtils';
import { createCommandModule } from '../lib/interactiveCommandModule';
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
});

export default useEnvCommandModule;
