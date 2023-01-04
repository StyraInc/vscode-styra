#!/usr/bin/env bash
# Should stay in sync with ../../fetchdb/packaging/validate-commit.sh

#set -x

git --no-pager log -n 5

gitfmt="format:%s%n%n%b"
commit="HEAD"
skip="0"

git log $commit --skip=$skip -1 --format=$gitfmt | head -1 | grep -q -E '^Merge '
if [ $? -eq 0 ]; then
  printf "Skipping merge commit.\n"
  skip="1"
fi

printf "Check if the commit is a revert.\n"
git log $commit --skip=$skip -1 --format=$gitfmt | head -1 | grep -E '^Revert ".+"'
if [ $? -eq 0 ]; then
  printf "Commit is a revert\n\n"
  exit 0
fi

printf "Check if the commit is created by dependabot.\n"
git log $commit --skip=$skip -1 --format=$gitfmt | head -1 | grep -E '^build\(deps\): bump '
if [ $? -eq 0 ]; then
  printf "Commit is created by dependabot\n\n"
  exit 0
fi

printf "Check subject has the module.\n"
git log $commit --skip=$skip -1 --format=$gitfmt | head -1 | grep -q -E "^(\[WiP\]\s)?([[:lower:][:digit:]_-]+\/?)+: "
if [ $? -ne 0 ]; then
  printf "\n\nERROR: Commit format: expected module in subject line\n"
  printf '\t first line must follow format `^(\[WiP\]\s)?([[:lower:][:digit:]_-]+\/?)+: `\n\n\n'
  exit 1
fi

printf "Check commit has a Jira issue #.\n"
git log $commit --skip=$skip -1 --format=$gitfmt | tail -1 | grep -q -E "STY-|sty-|SUPPORT-|support-|PLAT-|plat-|PLA-|pla-"
if [ $? -ne 0 ]; then
  printf "\n\nERROR: Commit format: Jira issue expected\n"
  printf '\t last line must follow format `STY-`\n\n\n'
  exit 1
fi
