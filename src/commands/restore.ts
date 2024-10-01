import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy } from '../lib/fsUtils';
import { createInteractiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const restoreCommandModule = createInteractiveCommandModule({
  command: 'restore [env-name]',
  describe: 'Restore env variables from a directory',
  interactiveFields: ['env-name'],
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
    logger.info(`Restoring config files for environment ${args.envName}`);

    await forEachEnvFile(
      ({ configDirPath, projectPath }) =>
        copy(configDirPath, projectPath, { overrideExisting: true }),
      args,
    );
  },
});

export default restoreCommandModule;
