import type { commonYargs } from '../cli';
import { getEnvFilesFromConfigDir } from '../lib/getEnvFiles';
import { interactiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { getEvenColumns } from '../lib/loggerUtils';

const listEnvFilesCommandModule = interactiveCommandModule<
  typeof commonYargs
>()(
  {
    command: 'list-env-files [env-name]',
    aliases: ['list-envs', 'envs'],
    describe: 'List all dotenv files under the project root',
    builder: (yargs) =>
      yargs.positional('env-name', {
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
      }),
    handler: async (args) => {
      const { envFileName } = args;
      logger.info(
        `Searching for environment files with pattern ${envFileName}`,
      );
      const envFilesInConfigDir = await getEnvFilesFromConfigDir(args);
      const columns = envFilesInConfigDir.map(
        ({ projectPath, configDirPath }) => [projectPath, configDirPath],
      );
      logger.info(getEvenColumns(columns, 2));
    },
  },
  { extraInteractiveFields: ['env-name'] },
);

export default listEnvFilesCommandModule;
