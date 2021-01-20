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

interface Row {
  cols: string[];
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

enum FieldEnum {
  ValueField,
  OptValueZeroField,
  OptValueOneField,
  OptValueTwoField,
  TagSetField,
  NameField,
  AlternateNameField,
  UnitTextField,
  MetaTagSetField,
  MetaIdField,
  FromNodeIdField,
  ToNodeIdField,
  NodeIdField,
}

const nodeFields = [
  FieldEnum.NodeIdField,
  FieldEnum.ValueField,
  FieldEnum.OptValueZeroField,
  FieldEnum.OptValueOneField,
  FieldEnum.OptValueTwoField,
  FieldEnum.TagSetField,
  FieldEnum.MetaIdField,
  FieldEnum.NameField,
  FieldEnum.AlternateNameField,
  FieldEnum.UnitTextField,
  FieldEnum.MetaTagSetField,
];

const edgeFields = [
  FieldEnum.FromNodeIdField,
  FieldEnum.ToNodeIdField,
  FieldEnum.ValueField,
  FieldEnum.OptValueZeroField,
  FieldEnum.OptValueOneField,
  FieldEnum.OptValueTwoField,
  FieldEnum.TagSetField,
  FieldEnum.MetaIdField,
  FieldEnum.NameField,
  FieldEnum.AlternateNameField,
  FieldEnum.UnitTextField,
  FieldEnum.MetaTagSetField,
];

const fieldEnumMap = new Map<FieldEnum, string>();
fieldEnumMap.set(FieldEnum.ValueField, 'value');
fieldEnumMap.set(FieldEnum.OptValueZeroField, 'opt_value_zero');
fieldEnumMap.set(FieldEnum.OptValueOneField, 'opt_value_one');
fieldEnumMap.set(FieldEnum.OptValueTwoField, 'opt_value_two');
fieldEnumMap.set(FieldEnum.TagSetField, 'tags');
fieldEnumMap.set(FieldEnum.NameField, 'name');
fieldEnumMap.set(FieldEnum.AlternateNameField, 'alt_name');
fieldEnumMap.set(FieldEnum.UnitTextField, 'unit_text');
fieldEnumMap.set(FieldEnum.MetaTagSetField, 'meta_tags');
fieldEnumMap.set(FieldEnum.FromNodeIdField, 'from_node');
fieldEnumMap.set(FieldEnum.ToNodeIdField, 'to_node');

enum SectionEnum {
  MetaSection,
  NodeSection,
  EdgeSection,
}

const sectionEnumMap = new Map<SectionEnum, string>();
sectionEnumMap.set(SectionEnum.MetaSection, 'meta');
sectionEnumMap.set(SectionEnum.NodeSection, 'node');
sectionEnumMap.set(SectionEnum.EdgeSection, 'edge');

interface Series {
  name: string;
  sectionId: SectionEnum;
  fieldId: FieldEnum;
  attributeId: number;
  values: number[];
  unused: number;
}

interface SeriesPath {
  sectionId: SectionEnum;
  fieldId: FieldEnum;
  attributeId: number;
  customId: number;
}

interface StringSeries {
  name: string;
  values: string[];
}

interface DataGraph {
  stringSeriesList: StringSeries[];
  seriesList: Series[];
}

interface TabularGraph {
  nodes: Row[];
  edges: Row[];
}

type ColumnTransformer = (row: Row, value: string) => number;

interface ColumnPathTransformer {
  path: SeriesPath;
  columnTransf: ColumnTransformer;
}
interface GraphContext {
  supportedTags: string[];
  customNames: string[];
  nodeTransformers: ColumnPathTransformer[];
  edgeTransformers: ColumnPathTransformer[];
}
const createSeriesPath = (
  sectionId: SectionEnum,
  fieldId: FieldEnum,
  attributeId: number,
  customId: number
): SeriesPath => ({ sectionId, fieldId, attributeId, customId });

const makeSeriesName = (sp: SeriesPath): string => {
  return `${sectionEnumMap.get(sp.sectionId)}_${fieldEnumMap.get(sp.fieldId)}_${
    sp.attributeId
  }_${sp.customId}`;
};
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

const transform4Nodes = (tabGraph: TabularGraph) => (
  pTransformer: ColumnPathTransformer
): Series => {
  const values: number[] = tabGraph.nodes.map(row =>
    pTransformer.columnTransf(row, row.cols[pTransformer.path.fieldId])
  );
  const unused: number = tabGraph.nodes.filter(
    row => row.cols[pTransformer.path.fieldId].length === 0
  ).length;
  return {
    name: makeSeriesName(pTransformer.path),
    sectionId: pTransformer.path.sectionId,
    fieldId: pTransformer.path.fieldId,
    attributeId: pTransformer.path.attributeId,
    values,
    unused,
  };
};
const map4Nodes = (
  tabGraph: TabularGraph,
  transformers: ColumnPathTransformer[]
): Series[] => transformers.map(transform4Nodes(tabGraph));

const nodeToRow = (
  attributes: AttributeMetadata[],
  attrMap: Map<string, number>,
  node: Node,
  attr: Attribute
): Row => {
  const cols = new Array<string>(nodeFields.length);
  const attrMeta = attributes[attrMap.get(attr.id) || 0];
  cols[FieldEnum.NodeIdField] = node.id;
  cols[FieldEnum.ValueField] = attr.value.trim();
  cols[FieldEnum.OptValueZeroField] =
    attr.optionalValueList.length > 0 ? attr.optionalValueList[0].trim() : '';
  cols[FieldEnum.OptValueOneField] =
    attr.optionalValueList.length > 1 ? attr.optionalValueList[1].trim() : '';
  cols[FieldEnum.OptValueTwoField] =
    attr.optionalValueList.length > 2 ? attr.optionalValueList[2].trim() : '';
  cols[FieldEnum.TagSetField] = attr.tagSet.join(';');
  cols[FieldEnum.MetaIdField] = attr.id;
  cols[FieldEnum.NameField] = attrMeta.name.trim();
  cols[FieldEnum.AlternateNameField] = attrMeta.alternateName.trim();
  cols[FieldEnum.UnitTextField] = attrMeta.unitText.trim();
  cols[FieldEnum.MetaTagSetField] = attrMeta.tagSet.join(';');
  return { cols };
};
const edgeToRow = (
  attributes: AttributeMetadata[],
  attrMap: Map<string, number>,
  edge: Edge,
  attr: Attribute
): Row => {
  const cols = new Array<string>(edgeFields.length);
  const attrMeta = attributes[attrMap.get(attr.id) || 0];
  cols[FieldEnum.FromNodeIdField] = edge.fromNode;
  cols[FieldEnum.ToNodeIdField] = edge.toNode;
  cols[FieldEnum.ValueField] = attr.value.trim();
  cols[FieldEnum.OptValueZeroField] =
    attr.optionalValueList.length > 0 ? attr.optionalValueList[0].trim() : '';
  cols[FieldEnum.OptValueOneField] =
    attr.optionalValueList.length > 1 ? attr.optionalValueList[1].trim() : '';
  cols[FieldEnum.OptValueTwoField] =
    attr.optionalValueList.length > 2 ? attr.optionalValueList[2].trim() : '';
  cols[FieldEnum.TagSetField] = attr.tagSet.join(';');
  cols[FieldEnum.MetaIdField] = attr.id;
  cols[FieldEnum.NameField] = attrMeta.name.trim();
  cols[FieldEnum.AlternateNameField] = attrMeta.alternateName.trim();
  cols[FieldEnum.UnitTextField] = attrMeta.unitText.trim();
  cols[FieldEnum.MetaTagSetField] = attrMeta.tagSet.join(';');
  return { cols };
};

const rangeNumber = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => i);

const toTabularGraph = (_ctx: GraphContext, graph: Graph): TabularGraph => {
  const attributeIdList = graph.attributeMetadataList.map(v => v.id);
  const idxAttributeIdMap = indexMap(attributeIdList);
  const nodes: Row[] = [];
  const edges: Row[] = [];
  for (const node of graph.nodeList) {
    for (const attr of node.attributeList) {
      const tabNodeAttr = nodeToRow(
        graph.attributeMetadataList,
        idxAttributeIdMap,
        node,
        attr
      );
      nodes.push(tabNodeAttr);
    }
  }
  for (const edge of graph.edgeList) {
    for (const attr of edge.attributeList) {
      const tabEdgeAttr = edgeToRow(
        graph.attributeMetadataList,
        idxAttributeIdMap,
        edge,
        attr
      );
      edges.push(tabEdgeAttr);
    }
  }
  return { nodes, edges };
};

const toDataGraph = (ctx: GraphContext, graph: Graph): DataGraph => {
  const unitTextSet = asStringSet(
    graph.attributeMetadataList.map(v => v.unitText.trim())
  );
  const unitTextList = [...unitTextSet].sort();
  const idxUnitTextMap = indexMap(unitTextList);

  const nodeIdList = graph.nodeList.map(v => v.id);
  const idxNodeIdMap = indexMap(nodeIdList);

  const attributeIdList: string[] = graph.attributeMetadataList.map(v => v.id);
  const attributeIdxList: number[] = rangeNumber(0, attributeIdList.length - 1);

  const tabGraph = toTabularGraph(ctx, graph);

  const prepStringList: string[] = tabGraph.nodes
    .map(row => row.cols[FieldEnum.ValueField])
    .concat(tabGraph.nodes.map(row => row.cols[FieldEnum.OptValueZeroField]))
    .concat(tabGraph.nodes.map(row => row.cols[FieldEnum.OptValueOneField]))
    .concat(tabGraph.nodes.map(row => row.cols[FieldEnum.OptValueTwoField]))
    .concat(tabGraph.edges.map(row => row.cols[FieldEnum.ValueField]))
    .concat(tabGraph.edges.map(row => row.cols[FieldEnum.OptValueZeroField]))
    .concat(tabGraph.edges.map(row => row.cols[FieldEnum.OptValueOneField]))
    .concat(tabGraph.edges.map(row => row.cols[FieldEnum.OptValueTwoField]));

  const stringValueSet = new Set(prepStringList);
  const stringValueList = [...stringValueSet].sort();
  const idxStringMap = indexMap(stringValueList);

  const stringTransf: ColumnTransformer = (_row: Row, value: string) =>
    idxStringMap.get(value) || -1;

  const valuesField = [
    FieldEnum.ValueField,
    FieldEnum.OptValueZeroField,
    FieldEnum.OptValueOneField,
    FieldEnum.OptValueTwoField,
    FieldEnum.NameField,
    FieldEnum.AlternateNameField,
  ];

  const CUSTOM_STRING = 0;
  const transfStringToIdx = (field: FieldEnum): ColumnPathTransformer[] =>
    attributeIdxList.map(aidx => ({
      path: createSeriesPath(
        SectionEnum.NodeSection,
        field,
        CUSTOM_STRING,
        aidx
      ),
      columnTransf: stringTransf,
    }));

  const defaultNodeTransformers: ColumnPathTransformer[] = valuesField.flatMap(
    transfStringToIdx
  );
  const nodeTransformers = ctx.nodeTransformers.concat(defaultNodeTransformers);

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
    seriesList: [],
  };
  return results;
};

export { parseAsGraph, toDataGraph, _transform4Node, _oldtransform4Node };
