import { type TCommonOptionsCamelCase, parser } from '../cli';
import { getProjectName } from '../lib/commonUtils';

export const runCommand = async (
  command: string,
  options: Record<string, string | number | boolean | string[]>,
) => {
  const getArg = (key: string, value: string | number | boolean) =>
    value === true ? `--${key}` : `--${key}=${value}`;

  const args = [
    command,
    ...Object.entries(options).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((listItem) => getArg(key, listItem));
      }
      return getArg(key, value);
    }),
  ].join(' ');

  return parser.parse(args);
};

export const createMockMetadataFile = ({
  metadataFilePath,
  configRoot,
  projectRoot,
  extraContent = {},
}: Pick<
  TCommonOptionsCamelCase,
  'metadataFilePath' | 'configRoot' | 'projectRoot'
> & { extraContent?: Record<string, unknown> }): Record<string, string> => ({
  [metadataFilePath]: JSON.stringify(
    {
      configRoot,
      projects: { [getProjectName(projectRoot)]: projectRoot },
      ...extraContent,
    },
    null,
    2,
  ),
});
