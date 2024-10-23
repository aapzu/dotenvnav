import { createCommandModule } from '../lib/createCommandModule';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { createValidateMetadataFileChecker } from '../lib/metadataFile';

const listEnvsCommandModule = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs.check(createValidateMetadataFileChecker()),
  handler: async (args) => {
    const { configRoot } = args;
    logger.info(`Getting environments from ${configRoot}`);
    logger.info((await getEnvs(args)).join('\n'));
  },
});

export default listEnvsCommandModule;
