import DataArray from './arraytypes';
import { DataNode, DataType } from './types';

class DataAtom implements DataNode {
    parent?: DataArray;
    type: DataType;
    strData?: string;
    intData?: number;
    floatData?: number;

    constructor(dataType: DataType) {
        this.type = dataType;
    }

    toString(): string {
        switch (this.type) {
            case DataType.STRING:
                return `${this.strData}`;
            case DataType.INT:
                return `${this.intData}`;
            case DataType.FLOAT:
                return `${this.floatData}`;
            default:
                return '**INVALID_DATA**';
        }
    }

    setParent(parent: DataArray): void {
        this.parent = parent;
    }

    get name(): string {
        return this.toString();
    }

    eval(): DataNode {
        return this;
    }
}

class DataSymbol implements DataNode {
    parent?: DataArray;
    value: string;
    quote: boolean;
    type: DataType = DataType.SYMBOL;

    constructor(value: string) {
        this.value = value;
        this.quote = false;

        for (let i = 0; i < value.length; i++) {
            const c = value.charAt(i);
            const chars = [' ', '\r', '\n', '\t', '(', ')', '{', '}', '[', ']'];
            if (chars.includes(c)) {
                this.quote = true;
                break;
            }
        }
    }

    eval(): DataNode {
        return this;
    }

    setParent(parent: DataArray): void {
        this.parent = parent;
    }

    get name(): string {
        return this.value;
    }
}

const cachedSymbols: Record<string, DataSymbol> = {};

function getSymbol(value: string): DataSymbol {
    if (cachedSymbols[value]) {
        return cachedSymbols[value];
    }

    const sym = new DataSymbol(value);
    cachedSymbols[value] = sym;
    return sym;
}

export { DataAtom, DataSymbol, getSymbol };
