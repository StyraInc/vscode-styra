import {IDE} from './vscode-api';

// These must match package.json!
// Also make sure that changes are reflected in mockVSCodeSettings.
export enum Setting {
  Diagnostic = 'diagnosticOutput',
  DiagnosticLimit = 'diagnosticLimit',
  Format = 'outputFormat',
  UpdateInterval = 'checkUpdateInterval'
}

// function to retrieve generic setting from IDE.getConfigValue with first arg 'styra';
// second arg must be one of the enum Setting values.
export function getSetting<T>(setting: Setting): T {
  return IDE.getConfigValue<T>('styra', setting) as T;
}
