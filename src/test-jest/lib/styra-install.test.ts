import { StyraInstall } from '../../lib/styra-install';

describe('StyraInstall', () => {
  test('checkWorkspace', () => {
    const inWorkspace = StyraInstall.checkWorkspace();
    expect(inWorkspace).toBe(true);

  });
});
