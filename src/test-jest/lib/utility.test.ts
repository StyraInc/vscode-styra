/* eslint-disable @typescript-eslint/naming-convention */
import {GenericJson} from '../../lib/types';
import {normalizeJsonProperties} from '../../lib/utility';

describe('normalizeJsonProperties', () => {

  // Note: only transforms top-level keys of an object
  [
    {description: 'all lower case', input: {one: 'value'}, expectedKeys: ['one']},
    {description: 'camel case', input: {testCaseHere1: 'value', termTwoX: 5}, expectedKeys: ['testCaseHere1', 'termTwoX']},
    {description: 'Pascal case', input: {TestCaseHere2: 'value', TermTwoX: 5}, expectedKeys: ['testCaseHere2', 'termTwoX']},
    {description: 'snake case', input: {Test_case_Here3: 'value', Term_two_x: 5}, expectedKeys: ['testCaseHere3', 'termTwoX']},
    {description: 'kebab case', input: {'Test-case-Here4': 'value', 'Term-two-x': 5}, expectedKeys: ['testCaseHere4', 'termTwoX']},
    {description: 'whitespace case', input: {'Test   case Here5': 'value', 'Term two x': 5}, expectedKeys: ['testCaseHere5', 'termTwoX']},
    {description: 'leading or trailing space', input: {' Test case Here6 ': 'value'}, expectedKeys: ['testCaseHere6']},
    {description: 'empty string key', input: {'': 'value'}, expectedKeys: ['']},
    {description: 'whitespace key', input: {' ': 'value'}, expectedKeys: [' ']},
    {
      description: 'SINGLE COLLISION case', input: {TermOne: 'value', termOne: 5},
      expectedKeys: ['termOne', 'termOne_COLLISION']
    },
    {
      description: 'MULTIPLE COLLISION case', input: {TermOne: 'value', termOne: 5, term_one: 0, 'term-one': 'foobar'},
      expectedKeys: ['termOne', 'termOne_COLLISION'] // rare multiple collisions still coalesce to single occurrence
    },
  ].forEach(({description, input, expectedKeys}: {description: string, input: GenericJson, expectedKeys: string[]}) => {
    test(`${description}: keys[${Object.keys(input).join(', ')}] => ${expectedKeys.join(', ')} `, () => {
      expect(Object.keys(normalizeJsonProperties(input)).sort()).toEqual(expectedKeys.sort());
    });
  });
});
