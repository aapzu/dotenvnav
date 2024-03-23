#!/usr/bin/env node --experimental-specifier-resolution=node

import { parser } from './cli';

await parser.parseAsync();
