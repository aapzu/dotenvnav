import * as GetEnvs from '../getEnvs';
import { createEnvChecker } from '../validators';

describe('validators', () => {
  describe('checkEnv', () => {
    it('should return true if env exists', async () => {
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await createEnvChecker('env')({
        env: 'default',
        'config-root': '/temp/.dotenvnav',
        'project-root': '/temp/projectRoot',
      } as never);
      expect(result).toBe(true);
    });

    it('should return false if env does not exist', async () => {
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await createEnvChecker('env')({
        env: 'foobar',
        'config-root': '/temp/.dotenvnav',
        'project-root': '/temp/projectRoot',
      } as never);
      expect(result).toBe(false);
    });
  });
});
