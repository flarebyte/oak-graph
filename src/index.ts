interface Taggable {
  tagSet: string[];
}

interface AttributeMetadata extends Taggable {
  id: string;
  name: string;
  alternateName: string;
  unitText: string;
  tagSet: string[];
}

interface Attribute extends Taggable {
  id: string;
  value: string;
  optionalValueList: string[];
  tagSet: string[];
}

interface WithAttributeList {
  attributeList: Attribute[];
}

interface Node extends WithAttributeList {
  id: string;
  attributeList: Attribute[];
}

interface Edge extends WithAttributeList {
  fromNode: string;
  toNode: string;
  attributeList: Attribute[];
}

interface Graph {
  attributeMetadataList: AttributeMetadata[];
  nodeList: Node[];
  edgeList: Edge[];
}

interface Series {
  name: string;
  values: number[];
}

interface StringSeries {
  name: string;
  values: string[];
}

// const seriesNameList = [
//   'attribute_id',
//   'node_id',
//   'node_attribute_id',
//   'node_name_id',
//   'node_alternate_id',
//   'node_unit_text_id',
//   'node_value_id',
//   'edge_from_node_id',
//   'edge_to_node_id',
//   'edge_attribute_id',
//   'edge_name_id',
//   'edge_alternate_id',
//   'edge_unit_text_id',
//   'edge_value_id',
// ];
// const stringSeriesNameList = ['anystring', 'unit_text', 'tag'];

interface DataGraph {
  stringSeriesList: StringSeries[];
  seriesList: Series[];
}

interface GraphContext {
  supportedTags: string[];
}

const parseAsGraph = (content: string): Graph => JSON.parse(content);

const asStringSet = (items: string[]) =>
  new Set(items.filter(s => s.length > 0));

const indexMap = (values: string[]): Map<string, number> => {
  const resultMap = new Map<string, number>();
  for (let index = 0; index < values.length; index++) {
    resultMap.set(values[index], index);
  }
  return resultMap;
};

const valueOrDefault = <T>(defaultValue: T) => (value: T | undefined) =>
  value === undefined ? defaultValue : value;

const toDataGraph = (ctx: GraphContext, graph: Graph): DataGraph => {
  const unitTextSet = asStringSet(
    graph.attributeMetadataList.map(v => v.unitText.trim())
  );

  const unitTextList = [...unitTextSet].sort();
  // const idxUnitTextMap = indexMap(unitTextList);

  const nodeIdList = graph.nodeList.map(v => v.id);
  const idxNodeIdMap = indexMap(nodeIdList);

  const fromNodeIdList = graph.edgeList.map(v =>
    valueOrDefault(-1)(idxNodeIdMap.get(v.fromNode))
  );
  const toNodeIdList = graph.edgeList.map(v =>
    valueOrDefault(-1)(idxNodeIdMap.get(v.toNode))
  );

  const attributeIdList = graph.attributeMetadataList.map(v => v.id);
  // const idxAttributeIdMap = indexMap(attributeIdList);

  const results = {
    stringSeriesList: [
      {
        name: 'tags',
        values: ctx.supportedTags,
      },
      {
        name: 'unit_text',
        values: unitTextList,
      },
      {
        name: 'node_id',
        values: nodeIdList,
      },
      {
        name: 'attribute_id',
        values: attributeIdList,
      },
      {
        name: 'attribute_name',
        values: graph.attributeMetadataList.map(v => v.name.trim()),
      },
      {
        name: 'attribute_alternate_name',
        values: graph.attributeMetadataList.map(v => v.alternateName.trim()),
      },
      {
        name: 'attribute_unit_text',
        values: graph.attributeMetadataList.map(v => v.unitText.trim()),
      },
    ],
    seriesList: [
      {
        name: 'from_node_id',
        values: fromNodeIdList,
      },
      {
        name: 'to_node_id',
        values: toNodeIdList,
      },
    ],
  };
  return results;
};

export { parseAsGraph, toDataGraph };
