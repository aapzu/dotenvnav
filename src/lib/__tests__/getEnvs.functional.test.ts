import { afterEach } from 'node:test';

import mock from 'mock-fs';
import { describe, it, expect } from 'vitest';

import { getEnvs } from '../getEnvs';

describe('getEnvs', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should find all envs', async () => {
    mock({
      '/.dotenvnav': {
        default: {},
        testEnv: {},
        foobar: {},
      },
    });
    expect(await getEnvs({ configRoot: '/.dotenvnav' })).toEqual([
      'default',
      'foobar',
      'testEnv',
    ]);
  });
});
