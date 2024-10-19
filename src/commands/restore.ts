import type { commonYargs } from '../cli';
import { forEachEnvFile } from '../lib/forAllEnvFiles';
import { copy } from '../lib/fsUtils';
import { getEnvs } from '../lib/getEnvs';
import { commandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const restoreCommandModule = commandModule<typeof commonYargs>()({
  command: 'restore',
  describe: 'Restore env variables from a directory',
  builder: async (yargs) => {
    const envs = await getEnvs(await yargs.argv);
    return yargs
      .option('env-name', {
        alias: 'e',
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
        demandOption: true,
        choices: envs,
      })
      .middleware(validateMetadataFile);
  },
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
