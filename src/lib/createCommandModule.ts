import { CommandModule } from 'yargs';

import type { TCommonOptions } from '../parser';

export const createCommandModule = <U>(
  module: CommandModule<TCommonOptions, U>,
) => module;
