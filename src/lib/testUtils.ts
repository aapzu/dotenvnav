import { parser } from '../parser';

export const runCommand = async (
  command: string,
  options: Record<string, string | number | boolean>,
) =>
  new Promise<string>((resolve, reject) => {
    const args = [
      command,
      ...Object.entries(options).map(([key, value]) => `--${key}=${value}`),
    ].join(' ');
    parser.parse(args, {}, (err, _argv, output) => {
      if (err) {
        reject(err);
      }
      resolve(output);
    });
  });
