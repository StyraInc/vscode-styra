import * as errs from '../../../lib/eopaPreview/errors';

describe('preview errors', () => {
  test.each([errs.EnvironmentError, errs.ArgumentError])('%p allows instantiation as an error', (constructor) => {
    const err = new constructor('some error message');
    expect(err).toBeInstanceOf(Error);
  });

  test('file error wraps an existing error', () => {
    const path = '/some/path/to/file.rego';
    const original = new Error('some error message');
    const err = new errs.FileError(original, path);
    expect(err.message).toContain(path);
    expect(err.name).toContain(path);
    expect(err.cause).toBe(original.cause);
    const stackFilter = (line: string) => !line.includes(__filename) && !line.includes(original.name);
    const errStack = (err.stack?.split('\n') || []).filter(stackFilter);
    const originalStack = (original.stack?.split('\n') || []).filter(stackFilter);
    expect(errStack.sort()).toEqual(originalStack.sort());
  });
});
