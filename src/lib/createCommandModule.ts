import type { CommandModule } from 'yargs';

import type { TCommonOptions } from '../cli';

export const createCommandModule = <U>(
  module: CommandModule<TCommonOptions, U>,
) => module;
