import type { commonYargs } from '../cli';
import { getEnvFilesFromConfigDir } from '../lib/getEnvFiles';
import { getEnvs } from '../lib/getEnvs';
import { commandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { getEvenColumns } from '../lib/loggerUtils';
import { validateMetadataFile } from '../lib/metadataFile';

const listEnvFilesCommandModule = commandModule<typeof commonYargs>()({
  command: 'list-env-files [env-name]',
  aliases: ['list-envs', 'envs'],
  describe: 'List all dotenv files under the project root',
  builder: async (yargs) => {
    const envs = await getEnvs(await yargs.argv);
    console.log(envs);
    return yargs
      .positional('env-name', {
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
        choices: envs,
      })
      .middleware(validateMetadataFile);
  },
  handler: async (args) => {
    const { envFileName } = args;
    logger.info(`Searching for environment files with pattern ${envFileName}`);
    const envFilesInConfigDir = await getEnvFilesFromConfigDir(args);
    const columns = envFilesInConfigDir.map(
      ({ projectPath, configDirPath }) => [projectPath, configDirPath],
    );
    logger.info(getEvenColumns(columns, 2));
  },
});

export default listEnvFilesCommandModule;
