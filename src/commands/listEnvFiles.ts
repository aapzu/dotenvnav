import { createCommandModule } from '../lib/createCommandModule';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';

const listEnvFilesCommandModule = createCommandModule({
  command: 'list-env-files [env-name]',
  aliases: ['list-envs'],
  describe: 'List all dotenv files under the project root',
  builder: (yargs) =>
    yargs.positional('env-name', {
      type: 'string',
      description: 'Name of the environment',
      default: 'default',
    }),
  handler: async (args) => {
    const { envFileName } = args;
    logger.info(`Searching for environment files with pattern ${envFileName}`);
    const envFiles = await getEnvFiles(args);
    logger.info(
      envFiles
        .map(
          ({ dotenvnavFileName, projectPath }) =>
            `${projectPath}\t${dotenvnavFileName}`,
        )
        .join('\n'),
    );
  },
});

export default listEnvFilesCommandModule;
