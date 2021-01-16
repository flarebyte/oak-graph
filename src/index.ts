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

enum FieldEnum {
  ValueField,
  OptValueZeroField,
  OptValueOneField,
  OptValueTwoField,
  OptValueThreeField,
  OptValueFourField,
  TagSetField,
  NameField,
  AlternateNameField,
  UnitTextField,
  MetaTagSetField,
  FromNodeField,
  ToNodeField,
}

const fieldEnumMap = new Map<FieldEnum, string>();
fieldEnumMap.set(FieldEnum.ValueField, 'value');
fieldEnumMap.set(FieldEnum.OptValueZeroField, 'opt_value_zero');
fieldEnumMap.set(FieldEnum.OptValueOneField, 'opt_value_one');
fieldEnumMap.set(FieldEnum.OptValueTwoField, 'opt_value_two');
fieldEnumMap.set(FieldEnum.OptValueThreeField, 'opt_value_three');
fieldEnumMap.set(FieldEnum.OptValueFourField, 'opt_value_four');
fieldEnumMap.set(FieldEnum.TagSetField, 'tags');
fieldEnumMap.set(FieldEnum.NameField, 'name');
fieldEnumMap.set(FieldEnum.AlternateNameField, 'alt_name');
fieldEnumMap.set(FieldEnum.UnitTextField, 'unit_text');
fieldEnumMap.set(FieldEnum.MetaTagSetField, 'meta_tags');
fieldEnumMap.set(FieldEnum.FromNodeField, 'from_node');
fieldEnumMap.set(FieldEnum.ToNodeField, 'to_node');

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
  used: number;
  unused: number;
}

interface SeriesPath {
  sectionId: SectionEnum;
  fieldId: FieldEnum;
  attributeId: number;
  custom: string;
}

interface StringSeries {
  name: string;
  values: string[];
}

interface DataGraph {
  stringSeriesList: StringSeries[];
  seriesList: Series[];
}

interface GraphContext {
  supportedTags: string[];
}

type ColumnTransformer = (
  meta: AttributeMetadata,
  attribute: Attribute,
  value: string
) => number;

interface ColumnPathTransformer {
  path: SeriesPath;
  defaultValue: number;
  columnTransf: ColumnTransformer;
}

const makeSeriesName = (sp: SeriesPath): string => {
  return `${sectionEnumMap.get(sp.sectionId)}_${fieldEnumMap.get(sp.fieldId)}_${
    sp.attributeId
  }_${sp.custom}`;
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

const getAttributeString = (
  meta: AttributeMetadata,
  attribute: Attribute,
  fieldId: FieldEnum
): string => {
  switch (fieldId) {
    case FieldEnum.ValueField:
      return attribute.value;
    case FieldEnum.OptValueZeroField:
      return attribute.optionalValueList.length > 0
        ? attribute.optionalValueList[0]
        : '';
    case FieldEnum.OptValueOneField:
      return attribute.optionalValueList.length > 1
        ? attribute.optionalValueList[1]
        : '';
    case FieldEnum.OptValueTwoField:
      return attribute.optionalValueList.length > 2
        ? attribute.optionalValueList[2]
        : '';
    case FieldEnum.OptValueThreeField:
      return attribute.optionalValueList.length > 3
        ? attribute.optionalValueList[3]
        : '';
    case FieldEnum.OptValueFourField:
      return attribute.optionalValueList.length > 4
        ? attribute.optionalValueList[4]
        : '';
    case FieldEnum.TagSetField:
      return attribute.tagSet.join(';');
    case FieldEnum.NameField:
      return meta.name;
    case FieldEnum.AlternateNameField:
      return meta.alternateName;
    case FieldEnum.UnitTextField:
      return meta.unitText;
    case FieldEnum.MetaTagSetField:
      return meta.tagSet.join(';');
    case FieldEnum.FromNodeField:
      return '';
    case FieldEnum.ToNodeField:
      return '';
  }
};

const transform4Node = (graph: Graph) => (
  pTransformer: ColumnPathTransformer
): Series => {
  const values: number[] = [];
  let used = 0;
  let unused = 0;
  const attrId = pTransformer.path.attributeId;
  const attrMeta = graph.attributeMetadataList[attrId];
  for (const iNode of graph.nodeList) {
    const maybeAttribute = iNode.attributeList.find(a => a.id === attrMeta.id);
    if (maybeAttribute === undefined) {
      unused++;
      values.push(pTransformer.defaultValue);
    } else {
      const targetValue = getAttributeString(
        attrMeta,
        maybeAttribute,
        pTransformer.path.fieldId
      );
      if (targetValue === '') {
        unused++;
        values.push(pTransformer.defaultValue);
      } else {
        used++;
        const value = pTransformer.columnTransf(
          attrMeta,
          maybeAttribute,
          targetValue
        );
        values.push(value);
      }
    }
  }
  return {
    name: makeSeriesName(pTransformer.path),
    sectionId: pTransformer.path.sectionId,
    fieldId: pTransformer.path.fieldId,
    attributeId: pTransformer.path.attributeId,
    values,
    used,
    unused,
  };
};

const map4Node = (
  graph: Graph,
  transformers: ColumnPathTransformer[]
): Series[] => transformers.map(transform4Node(graph));

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

  const valueOrNeg = valueOrDefault(-1);

  const stringAttrValueTranf: ColumnTransformer = (
    _m: AttributeMetadata,
    _a: Attribute,
    value: string
  ) => valueOrNeg(idxStringMap.get(value));
  const nodeTransf: ColumnPathTransformer[] = [
    {
      path: {
        sectionId: SectionEnum.NodeSection,
        fieldId: FieldEnum.ValueField,
        attributeId: 3,
        custom: 'value',
      },
      defaultValue: -1,
      columnTransf: stringAttrValueTranf,
    },
  ];

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
        sectionId: SectionEnum.EdgeSection,
        fieldId: FieldEnum.FromNodeField,
        attributeId: 0,
        used: fromNodeIdList.length,
        unused: 0,
      },
      {
        name: 'to_node_id',
        values: toNodeIdList,
        sectionId: SectionEnum.EdgeSection,
        fieldId: FieldEnum.ToNodeField,
        attributeId: 0,
        used: fromNodeIdList.length,
        unused: 0,
      },
    ].concat(map4Node(graph, nodeTransf)),
  };
  return results;
};

export { parseAsGraph, toDataGraph };
