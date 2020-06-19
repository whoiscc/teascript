import assert from 'assert';
import {
    Dispatch,
    If,
    LoadArg,
    LoadContext,
    LoadName,
    LoadState,
    Native,
    Return,
    Spawn,
    StoreName,
    StoreState,
    While,
    Break,
    Continue,
} from "./syntax";

function Source(code) {
    this.code = code;
    this.offset = 0;
}

Source.prototype.checkNext = function (expect) {
    if (expect.test(this.code[this.offset])) {
        return this.code[this.offset];
    } else {
        return null;
    }
}

Source.prototype.forward = function () {
    assert(this.offset < this.code.length);
    this.offset += 1;
}

Source.prototype.isEnd = function () {
    return this.offset === this.code.length;
}

function skipSpace(source) {
    let count = 0;
    while (!source.isEnd() && source.checkNext(/ /) !== null) {
        source.forward();
        count += 1;
    }
    return count;
}

function parseWord(source) {
    skipSpace(source);
    assert(!source.isEnd());
    let word = source.checkNext(/[a-zA-Z]/);
    assert(word !== null);
    source.forward();
    while (!source.isEnd()) {
        let letter = source.checkNext(/[a-zA-Z0-9]/);
        if (letter === null) {
            break;
        }
        word += letter;
        source.forward();
    }
    return word;
}

function parseExpr(source) {
    skipSpace(source);
    assert(!source.isEnd());
    let expr;
    if (source.checkNext(/&/) !== null) {
        source.forward();
        if (source.checkNext(/&/) !== null) {
            source.forward();
            expr = new LoadContext();
        } else {
            expr = new LoadState(parseWord(source));
        }
    } else {
        expr = new LoadName(parseWord(source));
    }
    skipSpace(source);
    if (!source.isEnd() && source.checkNext(/\./) !== null) {
        const message = parseWord(source);
        skipSpace(source);
        const args = [];
        if (!source.isEnd() && source.checkNext(/\(/) !== null) {
            source.forward();
            while (!source.isEnd() && source.checkNext(/\)/) === null) {
                args.push(parseExpr(source));
                skipSpace(source);
                if (source.checkNext(/,/) !== null) {
                    source.forward();
                } else {
                    assert(source.checkNext(/\)/) !== null);
                }
            }
        }
        expr = new Dispatch(expr, message, args);
    }
    return expr;
}