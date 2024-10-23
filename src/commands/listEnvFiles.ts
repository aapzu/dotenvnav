import { createCommandModule } from '../lib/createCommandModule';
import { getEnvFilesFromConfigDir } from '../lib/getEnvFiles';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { getEvenColumns } from '../lib/loggerUtils';
import { createValidateMetadataFileChecker } from '../lib/metadataFile';

const listEnvFilesCommandModule = createCommandModule({
  command: 'list-env-files [env-name]',
  aliases: ['list-envs'],
  describe: 'List all dotenv files under the project root',
  builder: async (yargs) =>
    yargs
      .positional('env-name', {
        type: 'string',
        description: 'Name of the environment',
        default: 'default',
        choices:
          (yargs.parsed && (await getEnvs(yargs.parsed.argv))) || undefined,
      })
      .check(createValidateMetadataFileChecker()),
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
