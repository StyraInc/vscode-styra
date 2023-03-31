import * as fs from 'fs';

// Purpose: Update the code coverage badge in the README.md file.
// Run this from the vscode-styra root directory.

// Usage: ts-node src/bin/update-coverage.ts

const COVERAGE_FILE = 'coverage/coverage-summary.json';
const README_FILE = 'README.md';
const BADGE_URL_REGEX = /https:\/\/img.shields.io\/badge\/Coverage-\d+%25-\w+/;
const BADGE_TEMPLATE = 'https://img.shields.io/badge/Coverage-<coverage>%25-<color>';

enum Threshold {
  Critical = 50,
  Warning = 70
}

function updateCoverageValue(filePath:string, regexp: RegExp, newURL: string) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const newContent = fileContent.replace(regexp, newURL);
  fs.writeFileSync(filePath, newContent);
}

function getCoverage(): number {
  const data = fs.readFileSync(COVERAGE_FILE, 'utf8');
  const parsed = JSON.parse(data);
  return Math.round(parsed.total.lines.pct);
}

function genCoverageUrl(coverage: number): string {
  return BADGE_TEMPLATE
    .replace('<coverage>', coverage.toString())
    .replace('<color>', getCoverageColor(coverage));
}

function getCoverageColor(coverage: number): string {
  // see https://shields.io/ for possible color names
  return coverage < Threshold.Critical ? 'red' : coverage < Threshold.Warning ? 'yellow' : 'brightgreen';

}

updateCoverageValue(README_FILE, BADGE_URL_REGEX, genCoverageUrl(getCoverage()));
