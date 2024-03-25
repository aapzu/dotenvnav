import { getEnvs } from './getEnvs';
import { logger } from './logger';

export const checkEnv = async (
  envName: string,
  configRoot: string,
  projectRoot: string,
) => {
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
