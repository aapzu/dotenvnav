import fs from 'fs/promises';

import { TRootOptions } from '../types';

export const getEnvs = async ({
  configRoot,
}: Pick<TRootOptions, 'configRoot'>) => {
  const envs = await fs.readdir(configRoot);
  return envs.filter((env) => !env.startsWith('.'));
};
