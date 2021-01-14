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
  //const idxAttributeIdMap = indexMap(attributeIdList);

  // TODO: trim
  const allNodeValues = graph.nodeList
    .flatMap(n => n.attributeList)
    .map(a => a.value);
  const allNodeOptValues = graph.nodeList
    .flatMap(n => n.attributeList)
    .flatMap(a => a.optionalValueList);
  const allEdgeValues = graph.edgeList
    .flatMap(n => n.attributeList)
    .map(a => a.value);
  const allEdgeOptValues = graph.edgeList
    .flatMap(n => n.attributeList)
    .flatMap(a => a.optionalValueList);

  const stringValueSet = new Set(
    allNodeValues
      .concat(allNodeOptValues)
      .concat(allEdgeValues)
      .concat(allEdgeOptValues)
  );
  const stringValueList = [...stringValueSet].sort();
  const idxStringMap = indexMap(stringValueList);

  const resultsNode: Series[] = [];

  graph.attributeMetadataList.forEach((iAttr, aId) => {
    const nodeColumnValues: number[] = [];
    const nodeColumnSizes: number[] = [];
    // Check all nodes
    for (const iNode of graph.nodeList) {
      const tempAttributes = iNode.attributeList.filter(a => a.id === iAttr.id);
      const stringValue =
        tempAttributes.length === 0 ? '' : tempAttributes[0].value;
      nodeColumnSizes.push(stringValue.length);
      const value =
        tempAttributes.length === 0
          ? -1
          : valueOrDefault(-1)(idxStringMap.get(tempAttributes[0].value));
      nodeColumnValues.push(value);
    }

    // summary for nodes
    const nodeCountWithValue = nodeColumnValues.filter(v => v >= 0).length;
    const nodeCountNoValue = nodeColumnValues.filter(v => v < 0).length;
    resultsNode.push({
      name: `node_attribute_stats_${aId}`,
      values: [nodeCountNoValue, nodeCountWithValue],
    });
    if (nodeCountWithValue) {
      resultsNode.push({
        name: `node_attribute_${aId}`,
        values: nodeColumnValues,
      });
      resultsNode.push({
        name: `node_attribute_size_${aId}`,
        values: nodeColumnSizes,
      });
    }
  });

  graph.attributeMetadataList.forEach((iAttr, aId) => {
    const edgeColumnValues: number[] = [];
    const edgeColumnSizes: number[] = [];
    // Check all edges
    for (const iEdge of graph.edgeList) {
      const tempAttributes = iEdge.attributeList.filter(a => a.id === iAttr.id);
      const stringValue =
        tempAttributes.length === 0 ? '' : tempAttributes[0].value;
      edgeColumnSizes.push(stringValue.length);
      const value =
        tempAttributes.length === 0
          ? -1
          : valueOrDefault(-1)(idxStringMap.get(tempAttributes[0].value));
      edgeColumnValues.push(value);
    }

    // summary for edge
    const edgeCountWithValue = edgeColumnValues.filter(v => v >= 0).length;
    const edgeCountNoValue = edgeColumnValues.filter(v => v < 0).length;
    resultsNode.push({
      name: `edge_attribute_stats_${aId}`,
      values: [edgeCountNoValue, edgeCountWithValue],
    });
    if (edgeCountWithValue) {
      resultsNode.push({
        name: `edge_attribute_${aId}`,
        values: edgeColumnValues,
      });
      resultsNode.push({
        name: `edge_attribute_size_${aId}`,
        values: edgeColumnSizes,
      });
    }
  });

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
      {
        name: 'strings',
        values: stringValueList,
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
    ].concat(resultsNode),
  };
  return results;
};

export { parseAsGraph, toDataGraph };
