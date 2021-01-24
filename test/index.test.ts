import {
  parseAsGraph,
  toDataGraph,
  toTabularGraph,
  StringSeriesEnum,
  FieldEnum,
} from '../src';
import fs from 'fs';

const fixtureAlpha = parseAsGraph(
  fs.readFileSync('./test/fixture-graph-alpha.json', 'utf8')
);

const fixtureExpectedAlphaDataGraph = require('./fixture-data-graph-alpha-expected.json');

const defaultCtx = {
  supportedTags: ['alpha', 'beta', 'delta'],
  customNames: ['value'],
  nodeTransformers: [],
  edgeTransformers: [],
};
describe('Management of graphs and networks', () => {
  it('validate the graph format', () => {
    const actual = fixtureAlpha;
    expect(actual).toBeDefined();
  });

  it('should generate a tabular graph', () => {
    const actual = toTabularGraph(defaultCtx, fixtureAlpha);
    expect(actual.nodes.length).toBeGreaterThanOrEqual(
      fixtureAlpha.nodeList.length
    );
    expect(actual.edges.length).toBeGreaterThanOrEqual(
      fixtureAlpha.edgeList.length
    );
    expect(actual.nodes.map(n => n.cols[FieldEnum.NameField])).toEqual([
      'Name',
      'Speed',
      'Name',
      'Name',
      'Name',
    ]);
    expect(actual.nodes.map(n => n.cols[FieldEnum.ValueField])).toEqual([
      'car',
      '100',
      'plane',
      'gold',
      'silver',
    ]);
  });
  it('should generate a data graph', () => {
    const actual = toDataGraph(defaultCtx, fixtureAlpha);
    //fs.writeFileSync('./test/fixture-data-graph-alpha-expected.json', JSON.stringify(actual, null, 2), 'utf8')
    expect(actual).toEqual(fixtureExpectedAlphaDataGraph);
    expect(actual.stringSeriesList[StringSeriesEnum.NodeId].kind).toBe(
      StringSeriesEnum.NodeId
    );
    expect(actual.stringSeriesList[StringSeriesEnum.MetaAttributeId].kind).toBe(
      StringSeriesEnum.MetaAttributeId
    );
    expect(actual.stringSeriesList[StringSeriesEnum.SupportedTags].kind).toBe(
      StringSeriesEnum.SupportedTags
    );
    expect(actual.stringSeriesList[StringSeriesEnum.AnyString].kind).toBe(
      StringSeriesEnum.AnyString
    );
    const nodeLength =
      actual.stringSeriesList[StringSeriesEnum.NodeId].values.length;
    expect(nodeLength).toEqual(fixtureAlpha.nodeList.length);
    expect(
      actual.nodeSeriesList.filter(s => s.values.length !== nodeLength)
    ).toHaveLength(0);
  });
});
