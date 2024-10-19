import type { commonYargs } from '../cli';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { createSymlink } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { commandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';
import { createEnvChecker } from '../lib/validators';

const useEnvCommandModule = commandModule<typeof commonYargs>()({
  command: 'use-env',
  aliases: ['env', 'use'],
  describe: 'Use an environment',
  builder: async (yargs) => {
    const envs = await getEnvs(await yargs.argv);
    return yargs
      .option('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        demandOption: true,
        choices: envs,
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
});

export default useEnvCommandModule;
