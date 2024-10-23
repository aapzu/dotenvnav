import { z } from 'zod';

import { getConfigDirectory } from './commonUtils';
import { exists, getFiles } from './fsUtils';

export const getEnvs = async (anyArgv: Record<string, unknown>) => {
  const { configRoot, projectRoot } = z
    .object({ configRoot: z.string(), projectRoot: z.string() })
    .parse(anyArgv);

  const configDirectory = getConfigDirectory({ configRoot, projectRoot });
  if (!(await exists(configDirectory))) {
    throw new Error(`Config directory does not exist: ${configDirectory}`);
  }
  return getFiles(configDirectory);
};
