import { readFileSync } from 'fs';

import DataArray from './arraytypes';
import { DataAtom, getSymbol } from './atomictypes';
import { DataType } from './types';

enum parseState {
    whitespace,
    inString,
    inLiteral,
    inSymbol,
    inComment
}

function parseDTAFile(file: string): DataArray {
    const data = readFileSync(file);
    return parseDTA(data);
}

function parseDTA(input: string | Buffer): DataArray {
    if (typeof input === 'string') {
        return parse(input);
    } else {
        return parse(input.toString());
    }
}

function parse(input: string): DataArray {
    let state = parseState.whitespace;
    const data = input + ' ';
    const root = new DataArray();
    let current = root;
    let tmpLiteral = '';
    let line = 1;

    for (let i = 0; i < data.length; i++) {
        const c = data.charAt(i);

        if (c === '\uFEFF') {
            continue;
        }

        if (c === '\n') {
            line++;
        }

        switch (state) {
            case parseState.whitespace: {
                switch (c) {
                    case "'":
                        tmpLiteral = '';
                        state = parseState.inSymbol;
                        break;
                    case '"':
                        tmpLiteral = '';
                        state = parseState.inString;
                        break;
                    case ';':
                        tmpLiteral = '';
                        state = parseState.inComment;
                        break;
                    case ' ':
                    case '\r':
                    case '\n':
                    case '\t':
                        continue;
                    case '}':
                    case ')':
                    case ']':
                        if (c != current.closingChar || !current.parent) {
                            throw new Error(
                                `mismatched closing brace encountered at line ${line}`
                            );
                        }
                        current = current.parent;
                        break;
                    case '(':
                        current = current.addNode(new DataArray());
                        break;
                    case '{':
                    case '[':
                        throw new Error(`not implemented`);

                    default:
                        state = parseState.inLiteral;
                        tmpLiteral = c;
                        continue;
                }
                break;
            }
            case parseState.inString: {
                switch (c) {
                    case '"': {
                        const atom = new DataAtom(DataType.STRING);
                        atom.strData = tmpLiteral;
                        current.addNode(atom);
                        state = parseState.whitespace;
                        break;
                    }
                    default:
                        tmpLiteral += c;
                        continue;
                }
                break;
            }
            case parseState.inLiteral: {
                switch (c) {
                    case ' ':
                    case '\r':
                    case '\n':
                    case '\t':
                        addLiteral(current, tmpLiteral);
                        state = parseState.whitespace;
                        break;
                    case '}':
                    case ')':
                    case ']':
                        addLiteral(current, tmpLiteral);
                        if (c != current.closingChar) {
                            throw new Error(
                                `Mismatched brace types encountered (${c}) (${current.closingChar})`
                            );
                        }
                        if (!current.parent) {
                            throw new Error(`No parent for ${current}`);
                        }
                        current = current.parent;
                        state = parseState.whitespace;
                        break;
                    case '(': {
                        addLiteral(current, tmpLiteral);
                        const newNode = new DataArray();
                        current.addNode(newNode);
                        current = newNode;
                        break;
                    }
                    case '{':
                        throw new Error('DataCommand not supported');

                    case '[':
                        throw new Error('DataMacroDefinition not supported');
                    default:
                        tmpLiteral += c;
                        continue;
                }
                break;
            }
            case parseState.inSymbol: {
                switch (c) {
                    case ' ':
                    case '\r':
                    case '\n':
                    case '\t':
                        throw new Error('Whitespace encountered in symbol');
                    case "'": {
                        const sym = getSymbol(tmpLiteral);
                        current.addNode(sym);
                        state = parseState.whitespace;
                        break;
                    }
                    default:
                        tmpLiteral += c;
                        continue;
                }
                break;
            }

            case parseState.inComment: {
                switch (c) {
                    case '\r':
                    case '\n':
                        current.addComment(tmpLiteral);
                        state = parseState.whitespace;
                        break;
                    default:
                        tmpLiteral += c;
                        continue;
                }
                break;
            }
        }
    }

    return root;
}

function addLiteral(current: DataArray, literal: string) {
    const num = parseFloat(literal);
    if (!isNaN(num)) {
        if (num % 1 == 0) {
            // integer
            const atom = new DataAtom(DataType.INT);
            atom.intData = num;
            current.addNode(atom);
        } else {
            // float
            const atom = new DataAtom(DataType.FLOAT);
            atom.floatData = num;
            current.addNode(atom);
        }
    } else {
        const atom = getSymbol(literal);
        current.addNode(atom);
    }
}

export { parseDTA, parseDTAFile };
