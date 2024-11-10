import { z } from 'zod';

import { getConfigDirectory } from './commonUtils';
import { exists, getFiles } from './fsUtils';
import { readMetadataFile } from './metadataFile';

export const getEnvs = async (anyArgv: Record<string, unknown>) => {
  const { projectRoot, metadataFilePath } = z
    .object({
      metadataFilePath: z.string(),
      projectRoot: z.string(),
    })
    .parse(anyArgv);

  const { configRoot } = await readMetadataFile(metadataFilePath);

  const configDirectory = getConfigDirectory({ configRoot, projectRoot });

  if (!(await exists(configDirectory))) {
    throw new Error(`Config directory does not exist: ${configDirectory}`);
  }
  return getFiles(configDirectory);
};
