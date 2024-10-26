import { getEnvs } from './getEnvs';
import { logger } from './logger';
import { readMetadataFile } from './metadataFile';

export const checkEnv = async (
  envName: string,
  metadataFilePath: string,
  projectRoot: string,
) => {
  const { configRoot } = await readMetadataFile({ metadataFilePath });
  const possibleEnvs = await getEnvs({ configRoot, projectRoot });
  if (!possibleEnvs.includes(envName)) {
    logger.error(
      `Environment ${envName} does not exist, possible envs: ${possibleEnvs.join(
        ', ',
      )}`,
    );
    return false;
  }
  return true;
};
