import { createCommandModule } from '../lib/createCommandModule';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { createSymlink } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { createValidateMetadataFileChecker } from '../lib/metadataFile';

const useEnvCommandModule = createCommandModule({
  command: 'use-env <env-name>',
  aliases: ['env <envName>', 'use <envName>'],
  describe: 'Use an environment',
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
