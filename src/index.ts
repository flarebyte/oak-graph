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

type AttributeTransformer = (attribute: Attribute) => number;
type StringValueTransformer = (value: string) => number;

const rangeNumber = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => i);

const mapNodeAttribute = (
  graph: Graph,
  name: string,
  defaultValue: number,
  excludeColumns: Set<number>,
  aTransf: AttributeTransformer
): Series[] => {
  const resultsNode: Series[] = [];
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    const excluded = new Set(excludeColumns);
    if (!excluded.has(aId)) {
      const nodeColumnValues: number[] = [];
      // Check all nodes
      for (const iNode of graph.nodeList) {
        const maybeAttribute = iNode.attributeList.find(a => a.id === iAttr.id);
        const numValue =
          maybeAttribute === undefined ? defaultValue : aTransf(maybeAttribute);
        nodeColumnValues.push(numValue);
      }
      resultsNode.push({
        name: `node_attribute_${name}_${aId}`,
        values: nodeColumnValues,
      });
    }
  });
  return resultsNode;
};

const mapNodeAttributeAltValues = (
  graph: Graph,
  name: string,
  defaultValue: number,
  maxAltValuesByColumn: number[],
  aTransf: StringValueTransformer
): Series[] => {
  const resultsNode: Series[] = [];
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    const maxLength = maxAltValuesByColumn[aId];
    for (let index = 0; index < maxLength; index++) {
      const nodeColumnValues: number[] = [];
      for (const iNode of graph.nodeList) {
        const maybeAttribute = iNode.attributeList.find(a => a.id === iAttr.id);
        const numValue =
          maybeAttribute === undefined
            ? defaultValue
            : aTransf(maybeAttribute.optionalValueList[index]);
        nodeColumnValues.push(numValue);
      }
      resultsNode.push({
        name: `node_attribute_opt_values_${index}_${name}_${aId}`,
        values: nodeColumnValues,
      });
    }
  });
  return resultsNode;
};

const getUnusedNodeAttributes = (graph: Graph): Set<number> => {
  const unused = new Set(
    rangeNumber(0, graph.attributeMetadataList.length - 1)
  );
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    // Check all nodes
    for (const iNode of graph.nodeList) {
      const maybeAttribute = iNode.attributeList.find(a => a.id === iAttr.id);
      if (maybeAttribute !== undefined) {
        unused.delete(aId);
        break;
      }
    }
  });
  return unused;
};

const getAltValuesMaxNodeAttributes = (graph: Graph): number[] => {
  const maxForAttrs = new Array(graph.attributeMetadataList.length).fill(0);
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    for (const iNode of graph.nodeList) {
      const maybeAttribute = iNode.attributeList.find(a => a.id === iAttr.id);
      if (maybeAttribute !== undefined) {
        const countAltValues = maybeAttribute.optionalValueList.length;
        maxForAttrs[aId] = Math.max(maxForAttrs[aId], countAltValues);
      }
    }
  });
  return maxForAttrs;
};

const mapEdgeAttribute = (
  graph: Graph,
  name: string,
  defaultValue: number,
  excludeColumns: Set<number>,
  aTransf: AttributeTransformer
): Series[] => {
  const resultsNode: Series[] = [];
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    const excluded = new Set(excludeColumns);
    if (!excluded.has(aId)) {
      const nodeColumnValues: number[] = [];
      // Check all edges
      for (const iNode of graph.edgeList) {
        const maybeAttribute = iNode.attributeList.find(a => a.id === iAttr.id);
        const numValue =
          maybeAttribute === undefined ? defaultValue : aTransf(maybeAttribute);
        nodeColumnValues.push(numValue);
      }
      resultsNode.push({
        name: `edge_attribute_${name}_${aId}`,
        values: nodeColumnValues,
      });
    }
  });
  return resultsNode;
};

const mapEdgeAttributeAltValues = (
  graph: Graph,
  name: string,
  defaultValue: number,
  maxAltValuesByColumn: number[],
  aTransf: StringValueTransformer
): Series[] => {
  const resultsNode: Series[] = [];
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    const maxLength = maxAltValuesByColumn[aId];
    for (let index = 0; index < maxLength; index++) {
      const nodeColumnValues: number[] = [];
      for (const iEdge of graph.edgeList) {
        const maybeAttribute = iEdge.attributeList.find(a => a.id === iAttr.id);
        const numValue =
          maybeAttribute === undefined
            ? defaultValue
            : aTransf(maybeAttribute.optionalValueList[index]);
        nodeColumnValues.push(numValue);
      }
      resultsNode.push({
        name: `edge_attribute_opt_values_${index}_${name}_${aId}`,
        values: nodeColumnValues,
      });
    }
  });
  return resultsNode;
};

const getUnusedEdgeAttributes = (graph: Graph): Set<number> => {
  const unused = new Set(
    rangeNumber(0, graph.attributeMetadataList.length - 1)
  );
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    for (const iEdge of graph.edgeList) {
      const maybeAttribute = iEdge.attributeList.find(a => a.id === iAttr.id);
      if (maybeAttribute !== undefined) {
        unused.delete(aId);
        break;
      }
    }
  });
  return unused;
};

const getAltValuesMaxEdgeAttributes = (graph: Graph): number[] => {
  const maxForAttrs = new Array(graph.attributeMetadataList.length).fill(0);
  graph.attributeMetadataList.forEach((iAttr, aId) => {
    for (const iEdge of graph.edgeList) {
      const maybeAttribute = iEdge.attributeList.find(a => a.id === iAttr.id);
      if (maybeAttribute !== undefined) {
        const countAltValues = maybeAttribute.optionalValueList.length;
        maxForAttrs[aId] = Math.max(maxForAttrs[aId], countAltValues);
      }
    }
  });
  return maxForAttrs;
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

  const excludedNodeAttributes = getUnusedNodeAttributes(graph);
  const excludedEdgeAttributes = getUnusedEdgeAttributes(graph);
  const maxAltValuesNode = getAltValuesMaxNodeAttributes(graph);
  const maxAltValuesEdge = getAltValuesMaxEdgeAttributes(graph);

  const valueOrNeg = valueOrDefault(-1);

  const attrValueTranf: AttributeTransformer = (attribute: Attribute) =>
    valueOrNeg(idxStringMap.get(attribute.value));
  const attrValueLengthTranf: AttributeTransformer = (attribute: Attribute) =>
    attribute.value.length;

  const stringAttrValueTranf: StringValueTransformer = (value: string) =>
    valueOrNeg(idxStringMap.get(value));

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
    ]
      .concat(
        mapNodeAttribute(
          graph,
          'value',
          -1,
          excludedNodeAttributes,
          attrValueTranf
        )
      )
      .concat(
        mapNodeAttribute(
          graph,
          'size',
          -1,
          excludedNodeAttributes,
          attrValueLengthTranf
        )
      )
      .concat(
        mapEdgeAttribute(
          graph,
          'value',
          -1,
          excludedEdgeAttributes,
          attrValueTranf
        )
      )
      .concat(
        mapEdgeAttribute(
          graph,
          'size',
          -1,
          excludedEdgeAttributes,
          attrValueLengthTranf
        )
      )
      .concat(
        mapNodeAttributeAltValues(
          graph,
          'value',
          -1,
          maxAltValuesNode,
          stringAttrValueTranf
        )
      )
      .concat(
        mapEdgeAttributeAltValues(
          graph,
          'value',
          -1,
          maxAltValuesEdge,
          stringAttrValueTranf
        )
      ),
  };
  return results;
};

export { parseAsGraph, toDataGraph };
