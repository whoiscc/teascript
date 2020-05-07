import assert from 'assert';

export default function TeaCup() {
    this.scopes = [];
}

function Scope(receiver, responder, args) {
    this.nameTable = {};
    this.args = args;
    this.receiver = receiver;
    this.responder = responder;
    this.returnFlag = false;
    this.result = null;
    this.breakFlag = false;
    this.continueFlag = false;
}

TeaCup.prototype.currentScope = function () {
    return this.scopes[this.scopes.length - 1];
}

TeaCup.prototype.loadName = function (name) {
    return this.currentScope().nameTable[name];
}

TeaCup.prototype.storeName = function (name, object) {
    this.currentScope().nameTable[name] = object;
}

TeaCup.prototype.loadArg = function (index) {
    return this.currentScope().args[index];
}

TeaCup.prototype.loadState = function (name) {
    return this.currentScope().responder.stateTable[name];
}

TeaCup.prototype.storeState = function (name, object) {
    this.currentScope().responder.stateTable[name] = object;
}

TeaCup.prototype.loadContext = function () {
    return this.currentScope().receiver;
}

function TeaObject(watcher, stateTable, dispatchTable) {
    this.watcher = watcher;
    this.stateTable = stateTable;
    this.dispatchTable = dispatchTable;
}

TeaCup.prototype.spawn = function (watcher, stateTable, dispatchTable) {
    return new TeaObject(watcher, stateTable, dispatchTable);
}

TeaCup.prototype.dispatch = function (receiver, message, args) {
    let responder = receiver;
    while (!(message in responder.dispatchTable)) {
        responder = responder.watcher;
    }
    const scope = new Scope(receiver, responder, args);
    this.scopes.push(scope);
    this.processStats(responder.dispatchTable[message]);
    assert(scope.returnFlag);
    assert(!scope.breakFlag);
    assert(!scope.continueFlag);
    this.scopes.pop();
    return scope.result;
}

TeaCup.prototype.processStats = function (stats) {
    for (let stat of stats) {
        stat.process(this);
        if (
            this.currentScope().returnFlag ||
            this.currentScope().breakFlag ||
            this.currentScope().continueFlag
        ) {
            break;
        }
    }
}

TeaCup.prototype.exitMethod = function (result) {
    this.currentScope().returnFlag = true;
    this.currentScope().result = result;
}

TeaCup.prototype.evaluateCond = function (expr) {
    const result = !this.currentScope().returnFlag && !this.currentScope().breakFlag &&
        this.dispatch(expr.evaluate(this), '$nativeBool', []);
    // this must not unset the two flags in if condition
    // if either flag is set, the following if is skipped
    this.currentScope().breakFlag = false;
    this.currentScope().continueFlag = false;
    return result;
}

TeaCup.prototype.exitLoop = function () {
    this.currentScope().breakFlag = true;
}

TeaCup.prototype.restartLoop = function () {
    this.currentScope().continueFlag = true;
}