import * as GetEnvs from '../getEnvs';
import { checkEnv } from '../validators';

describe('validators', () => {
  describe('checkEnv', () => {
    it('should return true if env exists', async () => {
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await checkEnv(
        'default',
        '/temp/.dotenvnav',
        '/temp/projectRoot',
      );
      expect(result).toBe(true);
    });

    it('should return false if env does not exist', async () => {
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await checkEnv(
        'foobar',
        '/temp/.dotenvnav',
        '/temp/projectRoot',
      );
      expect(result).toBe(false);
    });
  });
});
