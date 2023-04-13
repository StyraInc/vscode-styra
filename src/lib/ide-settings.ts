import {IDE} from './vscode-api';

// These must match package.json!
// Also make sure that changes are reflected in mockVSCodeSettings.
export enum Setting {
  Diagnostic = 'diagnosticOutput',
  DiagnosticLimit = 'diagnosticLimit',
  Format = 'outputFormat',
  UpdateInterval = 'checkUpdateInterval'
}

export const settingDefaults =
  {
    [Setting.Diagnostic]: false,
    [Setting.DiagnosticLimit]: 120,
    [Setting.Format]: 'table',
    [Setting.UpdateInterval]: 1
  };

// function to retrieve generic setting from IDE.getConfigValue with first arg 'styra';
// second arg must be one of the enum Setting values.
// If the value of IDE.getConfigValue is undefined, return instead a default from the defaults constant
export function getSetting<T>(setting: Setting): T {
  const configValue = IDE.getConfigValue<T>('styra', setting);
  const defaultValue = settingDefaults[setting];
  return (configValue ?? defaultValue) as T;
}
