import { parser } from '../parser';

export const runCommand = async (
  command: string,
  options: Record<string, string | number | boolean>,
) =>
  new Promise<void>((resolve, reject) => {
    const args = [
      command,
      ...Object.entries(options).map(([key, value]) => `--${key}=${value}`),
    ].join(' ');
    parser.parse(args, {}, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
