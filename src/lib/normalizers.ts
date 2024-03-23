import path from 'node:path';

const replaceTilde = (value: string) => {
  if (value.startsWith('~')) {
    if (!process.env.HOME) {
      throw new Error(
        'HOME environment variable is not set, cannot use ~ in the path',
      );
    }
    return value.replace('~', process.env.HOME);
  }
  return value;
};

export const normalizePath = (value: string) => {
  return path.resolve(process.cwd(), replaceTilde(path.normalize(value)));
};
