import { getEnvs } from '../lib/getEnvs';
import { logger } from '../lib/logger';
import { TRootOptions } from '../types';

export const listEnvs = async (options: TRootOptions) => {
  const { configRoot } = options;
  logger.info(`Getting environments from ${configRoot}`);
  console.log((await getEnvs(options)).join('\n'));
};
