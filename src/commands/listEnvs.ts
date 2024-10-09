import type { commonYargs } from '../cli';
import { getEnvs } from '../lib/getEnvs';
import { interactiveCommandModule } from '../lib/interactiveCommandModule';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const listEnvsCommandModule = interactiveCommandModule<typeof commonYargs>()({
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
