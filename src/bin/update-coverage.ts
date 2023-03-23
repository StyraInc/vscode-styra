import * as fs from 'fs';

const COVERAGE_FILE = 'coverage/coverage-summary.json';
const README_FILE = 'README.md';
const TEMPLATE = 'https://img.shields.io/badge/Coverage-';

function replaceFileContent(filePath:string, placeholder: RegExp, newText: string) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const newContent = fileContent.replace(placeholder, newText);
  fs.writeFileSync(filePath, newContent);
}

// cat coverage/coverage-summary.json | jq '.total.lines.pct | round'
function getCoverage() {
  const data = fs.readFileSync(COVERAGE_FILE, 'utf8');
  const parsed = JSON.parse(data);
  return Math.round(parsed.total.lines.pct);
}

// TODO: Update colors, too!
replaceFileContent(README_FILE, new RegExp(`${TEMPLATE}\\d+`), `${TEMPLATE}${getCoverage()}`);
