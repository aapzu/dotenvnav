import { TGetEnvFilesOpts, getEnvFiles } from "../lib/getEnvFiles";
import { logger } from "../lib/logger";

type TListEnvFilesOpts = TGetEnvFilesOpts;

export const listEnvFiles = async (options: TListEnvFilesOpts) => {
  logger.info(
    `Searching for environment files with pattern ${options.envFileName}`,
  );
  const envFiles = await getEnvFiles(options);
  console.log(
    envFiles
      .map(
        ({ dotenvnavFileName, projectPath }) =>
          `${projectPath}\t${dotenvnavFileName}`,
      )
      .join("\n"),
  );
};
