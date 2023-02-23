import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkInit} from '../../commands/link-init';
import {MultiStepInput} from '../../external/multi-step-input';
jest.mock('../../lib/snippet-installer');

describe('LinkInit', () => {

  beforeEach(() => {
    IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
  });

  [
    [true, 'creating new system'],
    [false, 'connecting to existing system'],
  ].forEach(([useNew, description]) => {
    test(`correct params are passed for ${description}`, async () => {
      const runnerMock = commandRunnerMock();

      MultiStepInput.prototype.showQuickPick = jest.fn()
          .mockImplementation(inputBoxMock(false, useNew as boolean));
      MultiStepInput.prototype.showInputBox = jest.fn()
          .mockImplementation(inputBoxMock(true, useNew as boolean));

      await new LinkInit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        ['link', 'init',
          useNew ? '--create' : '--existing',
          '--name', useNew ? 'my new DAS system' : 'my existing DAS system',
          '--path', 'authz',
          '--type', 'kubernetes',
          '--skip-git'
        ]);
    });
  });

  const commandRunnerMock = () => {
    // responds to query to fetch system types
    const runnerQuietMock = jest.fn().mockResolvedValue('["typeA", "typeB"]');
    CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;
    // responds to primary styra link command
    const runnerMock = jest.fn().mockResolvedValue('some info here');
    CommandRunner.prototype.runStyraCmd = runnerMock;
    return runnerMock;
  };

  // this mock robustly makes tests independent of the order of prompts
  const inputBoxMock = (isInputBox: boolean, isNew = true) => ({prompt, placeholder}: {prompt: string, placeholder: string}) => {
    let result: string;
    const target = isInputBox ? prompt : placeholder;
    switch (target.replace(/ \(.*\)/, '')) { // ignore trailing parenthetical, if any

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
  };

});
