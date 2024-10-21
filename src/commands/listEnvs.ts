import { createCommandModule } from '../lib/createCommandModule';
import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { readMetadataFile, validateMetadataFile } from '../lib/metadataFile';

const listEnvsCommandModule = createCommandModule({
  command: 'list-envs',
  aliases: ['envs'],
  describe: 'List all environments',
  builder: (yargs) => yargs.middleware(validateMetadataFile),
  handler: async ({ metadataFilePath, projectRoot }) => {
    const { configRoot } = await readMetadataFile({ metadataFilePath });
    logger.info(
      `Getting environments from ${configRoot} for project ${projectRoot}`,
    );
    logger.info((await getEnvs({ configRoot, projectRoot })).join('\n'));
  },
});

export default listEnvsCommandModule;
