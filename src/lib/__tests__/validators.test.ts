import { checkEnv } from '../validators';
import * as GetEnvs from '../getEnvs';

describe('validators', () => {
  describe('checkEnv', () => {
    it('should return true if env exists', async () => {
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await checkEnv('default', '/.dotenvnav');
      expect(result).toBe(true);
    });

    it('should return false if env does not exist', async () => {
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await checkEnv('foobar', '/.dotenvnav');
      expect(result).toBe(false);
    });
  });
});
