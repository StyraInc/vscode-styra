import {CommandRunner} from '../../lib/command-runner';
import {generatePickList} from '../../commands/utility';
import {IDE} from '../../lib/vscode-api';
import {LinkInit} from '../../commands/link-init';
import {MultiStepInput} from '../../external/multi-step-input';
import {SnippetInstaller} from '../../lib/snippet-installer';

describe('LinkInit', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
    SnippetInstaller.prototype.addSnippetsToProject = jest.fn();

    // most types do not care about the return value; setting up for the one that does
    runnerMock = jest.fn().mockResolvedValue('["typeA", "typeB"]');
    CommandRunner.prototype.runShellCmd = runnerMock;

    // provide responses to user inputs
    MultiStepInput.prototype.showQuickPick = quickPickMock();
    MultiStepInput.prototype.showInputBox = inputBoxMock();
  });

  test('invokes link command to initialize system', async () => {

    await new LinkInit().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'init']),
      expect.anything()
    );
  });

  test('invokes link command to fetch existing system types', async () => {

    await new LinkInit().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'global-config', 'read', 'systemTypes.#.name']),
      expect.anything()
    );
  });

  [
    [['--skip-git'], 'skip git initialization'],
    [['--type', 'kubernetes'], 'system type'],
    [['--path', 'authz'], 'authorization directory'],
  ].forEach(([terms, description]) => {
    test(`includes correct params for ${description}`, async () => {

      await new LinkInit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(terms as string[]),
        expect.anything()
      );
    });
  });

  [
    [true, 'creating new system'],
    [false, 'connecting to existing system'],
  ].forEach(([useNew, description]) => {
    test(`correct params are passed for ${description}`, async () => {

      MultiStepInput.prototype.showQuickPick = quickPickMock(useNew as boolean);

      await new LinkInit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(
          useNew ? ['--create', '--name', 'my new DAS system']
            : ['--existing', '--name', 'my existing DAS system']),
        expect.anything()
      );
    });
  });

  test('uses dynamic system type list to populate user prompt', async () => {
    await new LinkInit().run();

    expect(MultiStepInput.prototype.showQuickPick).toHaveBeenCalledWith(
      expect.objectContaining({items: generatePickList(['typeA', 'typeB'])})
    );
  });

  test('adds snippets after setting up system', async () => {
    await new LinkInit().run();

    expect(SnippetInstaller.prototype.addSnippetsToProject).toHaveBeenCalled();
  });

  // The `_inputMock` robustly makes tests independent of the order of prompts.
  // It handles both showQuickPick (which uses `placeholder`) and showInputBox (which uses `prompt`).
  // When reusing this, you should always have `isInputBox` to distinguish showQuickPick/showInputBox.
  // This test file needs only a single additional param; if more are needed
  // when writing a new test file, use an`InputMockOptions` as in link-config-git.test.

  const inputBoxMock = () => _inputMock(true, false /* don't care term */);
  const quickPickMock = (isNew = true) => _inputMock(false, isNew);

  const _inputMock = (isInputBox: boolean, isNew: boolean) =>
    jest.fn().mockImplementation(
      ({prompt, placeholder}: { prompt: string, placeholder: string }) => {
        let result: string;
        const target = (isInputBox ? prompt : placeholder).replace(/\s*\(.*\)/, ''); // ignore trailing parenthetical, if any
        switch (target) {
          case 'Create a new DAS system or connect with an existing one?':
            result = isNew ? 'create new DAS system' : 'connect with existing DAS system';
            break;
          case 'Choose a unique name for the DAS System':
            result = 'my new DAS system';
            break;
          case 'Enter the name of an existing DAS System':
            result = 'my existing DAS system';
            break;
          case 'Pick a system type':
            result = 'kubernetes';
            break;
          case 'Where should policies be stored in the project?':
            result = 'authz';
            break;
          default:
            result = 'UNKNOWN'; // should never happen
        }
        return isInputBox ? result : {label: result};
      });
});
