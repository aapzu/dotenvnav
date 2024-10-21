import { getConfigDirectory } from './commonUtils';
import { exists, getFiles } from './fsUtils';

export const getEnvs = async ({
  configRoot,
  projectRoot,
}: {
  configRoot: string;
  projectRoot: string;
}) => {
  const configDirectory = getConfigDirectory({ configRoot, projectRoot });
  if (!(await exists(configDirectory))) {
    throw new Error(`Config directory does not exist: ${configDirectory}`);
  }
  return getFiles(configDirectory);
};
