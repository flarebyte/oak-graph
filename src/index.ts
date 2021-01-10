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

interface VerboseString {
  id: number;
  text: string;
}

interface VerboseStringMap {
  [id: number]: VerboseString;
}

interface StringInfo {
  id: number;
  size: number;
}

interface VerboseNodeAttribute {
  nodeId: number;
  attributeId: number;
  attributeNameId: StringInfo;
  attributeAlternateNameId: StringInfo;
  attributeUnitTextId: StringInfo;
  attributeValueId: StringInfo;
  attributeOptionalValueIdList: StringInfo[];
  attributeTagIdSet: number[];
}

interface VerboseEdgeAttribute {
  fromNodeId: number;
  toNodeId: number;
  attributeId: number;
  attributeNameId: StringInfo;
  attributeAlternateNameId: StringInfo;
  attributeUnitTextId: StringInfo;
  attributeValueId: StringInfo;
  attributeOptionalValueIdList: StringInfo[];
  attributeTagIdSet: number[];
}

interface VerboseGraph {
  stringMap: VerboseStringMap;
  unitTextMap: VerboseStringMap;
  nodeAttributeList: VerboseNodeAttribute[];
  edgeAttributeList: VerboseEdgeAttribute[];
}

const parseAsGraph = (content: string): Graph => JSON.parse(content);

const toVerbose = (_graph: Graph): VerboseGraph => {
  const results = {
    stringMap: {},
    unitTextMap: {},
    nodeAttributeList: [],
    edgeAttributeList: [],
  };
  return results;
};

export { parseAsGraph, toVerbose };
