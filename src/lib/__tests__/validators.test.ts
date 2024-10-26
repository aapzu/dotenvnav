import * as GetEnvs from '../getEnvs';
import * as MetadataFile from '../metadataFile';
import { checkEnv } from '../validators';

describe('validators', () => {
  describe('checkEnv', () => {
    it("should call getEnvs with metadata file's configRoot", async () => {
      vi.spyOn(MetadataFile, 'readMetadataFile').mockResolvedValue({
        configRoot: 'configRoot',
        projects: { testProject: '' },
      });
      const getEnvsSpy = vi
        .spyOn(GetEnvs, 'getEnvs')
        .mockResolvedValue(['default', 'test']);
      await checkEnv('default', '/temp/.dotenvnav', '/temp/projectRoot');
      expect(getEnvsSpy).toHaveBeenCalledWith({
        configRoot: 'configRoot',
        projectRoot: '/temp/projectRoot',
      });
    });

    it('should return true if env exists', async () => {
      vi.spyOn(MetadataFile, 'readMetadataFile').mockResolvedValue({
        configRoot: '/temp/.dotenvnav',
        projects: { testProject: '/temp/projectRoot' },
      });
      vi.spyOn(GetEnvs, 'getEnvs').mockResolvedValue(['default', 'test']);
      const result = await checkEnv(
        'default',
        '/temp/.dotenvnav',
        '/temp/projectRoot',
      );
      expect(result).toBe(true);
    });

    it('should return false if env does not exist', async () => {
      vi.spyOn(MetadataFile, 'readMetadataFile').mockResolvedValue({
        configRoot: '/temp/.dotenvnav',
        projects: { testProject: '/temp/projectRoot' },
      });
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
