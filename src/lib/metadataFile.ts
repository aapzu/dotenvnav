import { z } from 'zod';

import type { TCommonOptions, TCommonOptionsCamelCase } from '../cli';

import type { Arguments } from 'yargs';
import { getProjectName } from './commonUtils';
import { exists, readFileContent, writeFile } from './fsUtils';
import { logger } from './logger';

const metadataFileSchema = z
  .object({
    configRoot: z.string(),
    projects: z.record(z.string(), z.string()),
  })
  .strict();

export type MetadataFile = z.infer<typeof metadataFileSchema>;

export const upsertMetadataFile = async ({
  configRoot,
  projectRoot,
  metadataFilePath,
}: {
  configRoot: string;
  projectRoot: string;
  metadataFilePath: string;
}) => {
  const currentMetadataFile = (await exists(metadataFilePath))
    ? await readMetadataFile({ metadataFilePath })
    : undefined;

  const metadata: MetadataFile = {
    configRoot,
    projects: {
      ...(currentMetadataFile?.projects ?? {}),
      [getProjectName(projectRoot)]: projectRoot,
    },
  };

  logger.debug('Creating or updating the metadata file');

  await writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
};

export const readMetadataFile = async ({
  metadataFilePath,
}: Pick<
  TCommonOptionsCamelCase,
  'metadataFilePath'
>): Promise<MetadataFile> => {
  const fileContent = await readFileContent(metadataFilePath);
  let parsedMetadataFile: unknown;
  try {
    parsedMetadataFile = JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid JSON in metadata file');
  }
  try {
    return metadataFileSchema.parse(parsedMetadataFile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid metadata file: ${JSON.stringify(error.format(), null, 2)}`,
      );
    }
    throw error;
  }
};

type TValidateMetadatefileCheckerOptions = { allowNotExists?: boolean };

export const createValidateMetadataFileChecker =
  ({ allowNotExists = false }: TValidateMetadatefileCheckerOptions = {}) =>
  async ({
    'metadata-file-path': metadataFilePath,
    'project-root': projectRoot,
    'config-root': configRoot,
  }: Arguments<TCommonOptions>) => {
    if (!(await exists(metadataFilePath))) {
      if (allowNotExists) {
        logger.debug('No metadata file found');
        return true;
      }
      return `Metadata file not found in ${metadataFilePath}. Please run 'init' first.`;
    }

    const metadataFileContent = await readMetadataFile({ metadataFilePath });
    const projectName = getProjectName(projectRoot);
    const initializedWithProjectRoot =
      metadataFileContent.projects[projectName];

    if (
      metadataFileContent.configRoot &&
      configRoot &&
      metadataFileContent.configRoot !== configRoot
    ) {
      return `The metadata file ${metadataFilePath} was initialized with different config root (${metadataFileContent.configRoot}). Refusing to proceed.`;
    }

    if (!initializedWithProjectRoot) {
      if (allowNotExists) {
        return true;
      }
      return `The project ${projectName} was not initialized. Please run 'init' first.`;
    }
    if (initializedWithProjectRoot !== projectRoot) {
      return `The project ${projectName} was initialized using different project root (${initializedWithProjectRoot}). Refusing to proceed.`;
    }

    return true;
  };
