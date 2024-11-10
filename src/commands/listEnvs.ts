import { createCommandModule } from '../lib/createCommandModule';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import {
  createValidateMetadataFileChecker,
  readMetadataFile,
} from '../lib/metadataFile';

const listEnvsCommandModule = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs.check(createValidateMetadataFileChecker()),
  handler: async (args) => {
    const { metadataFilePath, projectRoot } = args;
    const { configRoot } = await readMetadataFile(metadataFilePath);
    logger.info(
      `Getting environments from ${configRoot} for project ${projectRoot}`,
    );
    logger.info((await getEnvs(args)).join('\n'));
  },
});

export default listEnvsCommandModule;
