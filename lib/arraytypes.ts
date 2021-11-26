import { DataAtom } from './atomictypes';
import { DataNode, DataType } from './types';

class DataArray implements DataNode {
    parent?: DataArray;

    closingChar: string;
    children: DataNode[] = [];
    comments: string[] = [];
    type: DataType = DataType.ARRAY;

    constructor() {
        this.closingChar = ')';
    }

    setParent(parent: DataArray): void {
        this.parent = parent;
    }

    eval(): DataNode {
        const ret = new DataArray();
        for (const node of this.children) {
            ret.addNode(node.eval());
        }

        return ret;
    }

    addNode<T extends DataNode>(node: T): T {
        node.setParent(this);
        this.children.push(node);
        return node;
    }

    addComment(comment: string): void {
        this.comments.push(comment);
    }

    /**
     * Array finds the array with name `name` in the children
     * @param name The name of the array to find
     * @returns The array with name `name` or undefined if not found
     */
    Array(name: string): DataArray | undefined {
        for (const node of this.children) {
            if (node.type !== DataType.ARRAY) {
                continue;
            }

            if (node.name === name && node instanceof DataArray) {
                return node;
            }
        }

        return undefined;
    }

    // String finds the string in the array's children at the given index.
    String(index: number): string | undefined {
        const node = this.children[index];
        if (node && node.type === DataType.STRING) {
            return node.name;
        }
        return undefined;
    }

    // Int finds the int in the array's children at the given index.
    Int(index: number): number | undefined {
        const node = this.children[index];
        if (node && node instanceof DataAtom && node.type === DataType.INT) {
            return node.intData;
        }

        return undefined;
    }

    // Float finds the float in the array's children at the given index.
    Float(index: number): number | undefined {
        const node = this.children[index];
        if (node && node instanceof DataAtom && node.type === DataType.FLOAT) {
            return node.floatData;
        }

        return undefined;
    }

    get name(): string {
        if (
            this.children.length === 0 ||
            this.children[0].type == DataType.ARRAY
        ) {
            return '';
        }

        return this.children[0].name;
    }

    getNodeAtPath(path: string): DataArray | undefined {
        const parts = path.split('.');

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentArr: DataArray = this;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part === '') {
                continue;
            }

            for (const child of currentArr.children) {
                if (child.name === part) {
                    if (!(child instanceof DataArray))
                        throw new Error('shouldnt happen?');

                    if (i === parts.length - 1) {
                        // last section, want value
                        return child;
                    }

                    currentArr = child;
                    break;
                }
            }

            // at this point current node name must be section
            if (currentArr.name !== part) {
                break;
            }
        }

        return undefined;
    }

    getStringAtPath(path: string): string | undefined {
        const node = this.getNodeAtPath(path);
        if (!node) return undefined;

        if (node.children.length < 1) return undefined;

        switch (node.children[1].type) {
            case DataType.STRING:
                return node.String(1);
            case DataType.INT:
                return node.Int(1)?.toString();
            case DataType.FLOAT:
                return node.Float(1)?.toString();
            case DataType.SYMBOL:
                return node.children[1].name;
            default:
                return undefined;
        }
    }

    getIntAtPath(path: string): number | undefined {
        const node = this.getNodeAtPath(path);
        if (!node) return undefined;

        if (node.children.length < 1) return undefined;

        switch (node.children[1].type) {
            case DataType.INT:
                return node.Int(1);
            default:
                return undefined;
        }
    }
}

export default DataArray;
