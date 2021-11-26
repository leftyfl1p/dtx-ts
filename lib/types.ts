import DataArray from './arraytypes';

enum DataType {
    INT = 0x00,
    FLOAT = 0x01,
    VARIABLE = 0x02,
    SYMBOL = 0x05,
    EMPTY = 0x06,
    IFDEF = 0x07,
    ELSE = 0x08,
    ARRAY = 0x10,
    COMMAND = 0x11,
    STRING = 0x12,
    MARCO = 0x13,
    DEFINE = 0x20,
    INCLUDE = 0x21,
    MERGE = 0x22,
    IFNDEF = 0x23
}

interface DataNode {
    parent?: DataArray;
    setParent(parent: DataArray): void;
    name: string;
    type: DataType;
    eval(): DataNode;
}

export { DataNode, DataType };
