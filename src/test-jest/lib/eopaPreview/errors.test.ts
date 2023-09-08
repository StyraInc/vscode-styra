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
  test('API error will tailor its based on the response body', () => {
    const responseCode = 400;
    const code = 'argument error';
    const message = 'the wrong stuff was sent';

    let err = new errs.APIError(responseCode);
    expect(err.message).toBe('General API error (400)');

    err = new errs.APIError(responseCode, {});
    expect(err.message).toBe('General API error (400)');

    err = new errs.APIError(responseCode, {message});
    expect(err.message).toBe('400: the wrong stuff was sent');

    err = new errs.APIError(responseCode, {message, code});
    expect(err.message).toBe('argument error (400): the wrong stuff was sent');
  });

  test('API error exposes the response code', () => {
    const responseCode = 500;
    const body = {code: 'internal error', message: 'something went wrong'};
    const err = new errs.APIError(responseCode, body);
    expect(err.responseCode).toBe(responseCode);
    expect(err.body).toEqual(body);
  });
});
