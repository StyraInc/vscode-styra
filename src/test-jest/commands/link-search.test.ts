import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkSearch} from '../../commands/link-search';
import {MultiStepInput} from '../../external/multi-step-input';

describe('LinkSearch', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
  });

  test('invokes base link CLI command', async () => {

    MultiStepInput.prototype.showQuickPick = quickPickMock();
    MultiStepInput.prototype.showInputBox = inputBoxMock();

    await new LinkSearch().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'rules', 'search']),
      expect.anything()
    );
  });

  [
    ['title', 'title-part', 'Enter portion of a snippet title to search for'],
    ['id', 'rule-id', 'Enter exact rule ID to search for'],
  ].forEach(([type, value, prompt]) => {
    const options = {searchByTitle: type === 'title'};

    test(`correct params are passed for ${type} search`, async () => {
      MultiStepInput.prototype.showQuickPick = quickPickMock(options);
      MultiStepInput.prototype.showInputBox = inputBoxMock(options);

      await new LinkSearch().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining([value]),
        expect.anything()
      );
      if (options.searchByTitle) {
        expect(runnerMock).not.toHaveBeenCalledWith(
          'styra',
          expect.arrayContaining(['--rule', value]),
          expect.anything()
        );
      }
    });

    test(`correct prompts are invoked for ${type} search`, async () => {
      MultiStepInput.prototype.showQuickPick = quickPickMock(options);
      MultiStepInput.prototype.showInputBox = inputBoxMock(options);

      await new LinkSearch().run();

      expect(MultiStepInput.prototype.showInputBox).toHaveBeenCalledWith(
        expect.objectContaining({prompt}));
    });
  });

  ['table',
    'JSON',
    'YAML'
  ].forEach((format) => {
    test(`invokes CLI command with ${format} format`, async () => {

      MultiStepInput.prototype.showQuickPick = quickPickMock({format});
      MultiStepInput.prototype.showInputBox = inputBoxMock();

      await new LinkSearch().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'rules', 'search', 'title-part', '--output', format.toLowerCase()]),
        expect.anything()
      );
    });
  });

  type InputMockOptions = {
    format?: string;
    searchByTitle?: boolean;
  }

  const inputBoxMock = (options?: InputMockOptions) =>
    _inputMock(true, options);
  const quickPickMock = (options?: InputMockOptions) =>
    _inputMock(false, {searchByTitle: true, ...options});

  const _inputMock = (isInputBox: boolean, options: InputMockOptions = {searchByTitle: true, format: 'table'}) =>
    jest.fn().mockImplementation(
      ({prompt, placeholder}: { prompt: string, placeholder: string }) => {
        let result: string;
        const target = (isInputBox ? prompt : placeholder).replace(/\s*\(.*\)/, ''); // ignore trailing parenthetical, if any
        switch (target) {
          case 'Select what to search':
            result = options.searchByTitle ? 'snippet title (partials OK)' : 'snippet id (exact match)';
            break;
          case 'Enter portion of a snippet title to search for':
            result = 'title-part';
            break;
          case 'Enter exact rule ID to search for':
            result = 'rule-id';
            break;
          case 'Select output format':
            result = options.format ?? '';
            break;
          default:
            result = 'UNKNOWN'; // should never happen
        }
        return isInputBox ? result : {label: result};
      });
});
