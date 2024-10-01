import { getEnvs } from '../lib/getEnvs';
import { createCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const listEnvsCommandModule = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs.middleware(validateMetadataFile),
  handler: async (args) => {
    const { configRoot } = args;
    logger.info(`Getting environments from ${configRoot}`);
    logger.info((await getEnvs(args)).join('\n'));
  },
});

export default listEnvsCommandModule;
