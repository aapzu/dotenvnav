import { createCommandModule } from '../lib/createCommandModule';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';

const listEnvsCommand = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs,
  handler: async ({ configRoot }) => {
    logger.info(`Getting environments from ${configRoot}`);
    console.log((await getEnvs({ configRoot })).join('\n'));
  },
});

export default listEnvsCommand;
