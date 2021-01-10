import { parseAsGraph } from '../src';
import fs from 'fs';

const fixtureAlpha = parseAsGraph(
  fs.readFileSync('./test/fixture-graph-alpha.json', 'utf8')
);

describe('Management of graphs and networks', () => {
  it('validate the graph format', () => {
    const actual = fixtureAlpha;
    expect(actual).toBeDefined();
  });
});
