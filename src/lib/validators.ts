import type { TCommonOptions } from '../cli';
import { getEnvs } from './getEnvs';
import { logger } from './logger';

export const createEnvChecker =
  <K extends string>(envField: K) =>
  async (argv: TCommonOptions & { [key in K]: string }) => {
    const configRoot = argv['config-root'];
    const projectRoot = argv['project-root'];
    const envName = argv[envField];
    if (!envName) {
      logger.error(`${envField} is required`);
      return false;
    }
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
