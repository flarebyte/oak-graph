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
  values: Uint32Array;
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

const parseAsGraph = (content: string): Graph => JSON.parse(content);

const asStringSet = (items: string[]) =>
  new Set(items.filter(s => s.length > 0));

const toDataGraph = (graph: Graph): DataGraph => {
  const unitTextSet = asStringSet(
    graph.attributeMetadataList.map(v => v.unitText.trim())
  );
  const results = {
    stringSeriesList: [
      {
        name: 'unit_text',
        values: [''].concat([...unitTextSet].sort()),
      },
    ],
    seriesList: [],
  };
  return results;
};

export { parseAsGraph, toDataGraph };
