import { createCommandModule } from '../lib/createCommandModule';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { validateMetadataFile } from '../lib/metadataFile';

const listEnvsCommandModule = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs,
  handler: async (args) => {
    await validateMetadataFile(args);

    const { configRoot } = args;
    logger.info(`Getting environments from ${configRoot}`);
    logger.info((await getEnvs({ configRoot })).join('\n'));
  },
});

export default listEnvsCommandModule;
