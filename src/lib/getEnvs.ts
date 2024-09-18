import type { TCommonOptionsCamelCase } from '../cli';

import { getConfigDirectory } from './commonUtils';
import { exists, getFiles } from './fsUtils';

export const getEnvs = async ({
  configRoot,
  projectRoot,
}: Pick<TCommonOptionsCamelCase, 'configRoot' | 'projectRoot'>) => {
  const configDirectory = getConfigDirectory({ configRoot, projectRoot });
  if (!(await exists(configDirectory))) {
    throw new Error(`Config directory does not exist: ${configDirectory}`);
  }
  return getFiles(configDirectory);
};
