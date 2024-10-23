import { createCommandModule } from '../lib/createCommandModule';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { createValidateMetadataFileChecker } from '../lib/metadataFile';

const restoreCommandModule = createCommandModule({
  command: 'restore [env-name]',
  describe: 'Restore env variables from a directory',
  builder: async (yargs) =>
    yargs
      .positional('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
        choices:
          (yargs.parsed && (await getEnvs(yargs.parsed.argv))) || undefined,
      })
      .check(createValidateMetadataFileChecker()),
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
