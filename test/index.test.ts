import { parseAsGraph, toDataGraph } from '../src';
import fs from 'fs';

const fixtureAlpha = parseAsGraph(
  fs.readFileSync('./test/fixture-graph-alpha.json', 'utf8')
);

const fixtureExpectedAlphaDataGraph = require('./fixture-data-graph-alpha-expected.json');

const defaultCtx = {
  supportedTags: ['alpha', 'beta', 'delta'],
};
describe('Management of graphs and networks', () => {
  it('validate the graph format', () => {
    const actual = fixtureAlpha;
    expect(actual).toBeDefined();
  });

  it('should generate a data graph', () => {
    const actual = toDataGraph(defaultCtx, fixtureAlpha);
    console.log(JSON.stringify(actual, null, 2));
    expect(actual).toEqual(fixtureExpectedAlphaDataGraph);
  });
});
