import { createCommandModule } from '../lib/createCommandModule';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';

const listEnvsCommandModule = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs,
  handler: async ({ configRoot }) => {
    logger.info(`Getting environments from ${configRoot}`);
    logger.info((await getEnvs({ configRoot })).join('\n'));
  },
});

export default listEnvsCommandModule;
