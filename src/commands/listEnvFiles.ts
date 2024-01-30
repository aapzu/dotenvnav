import { createCommandModule } from '../lib/createCommandModule';
import { getEnvFiles } from '../lib/getEnvFiles';
import { logger } from '../lib/logger';

const listEnvFilesCommand = createCommandModule({
  command: 'list-env-files [env-name]',
  aliases: ['list-envs'],
  describe: 'List all dotenv files under the project root',
  builder: (yargs) =>
    yargs.positional('env-name', {
      type: 'string',
      description: 'Name of the environment',
      default: 'default',
    }),
  handler: async (options) => {
    logger.info(
      `Searching for environment files with pattern ${options.envFileName}`,
    );
    const envFiles = await getEnvFiles(options);
    console.log(
      envFiles
        .map(
          ({ dotenvnavFileName, projectPath }) =>
            `${projectPath}\t${dotenvnavFileName}`,
        )
        .join('\n'),
    );
  },
});

export default listEnvFilesCommand;
