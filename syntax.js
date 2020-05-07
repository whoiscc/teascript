// expr
function Spawn(watcher, stateTable, dispatchTable) {
    this.watcher = watcher;
    this.stateTable = stateTable;
    this.dispatchTable = dispatchTable;
}

function Dispatch(receiver, message, args) {
    this.receiver = receiver;
    this.message = message;
    this.args = args;
}

function LoadName(name) {
    this.name = name;
}

function LoadState(name) {
    this.name = name;
}

function LoadArg(index) {
    this.index = index;
}

function LoadContext() {
}

// stat
function StoreName(name, expr) {
    this.name = name;
    this.expr = expr;
}

function StoreState(name, expr) {
    this.name = name;
    this.expr = expr;
}

function Return(expr) {
    this.expr = expr;
}

function If(cond, pos, neg) {
    this.cond = cond;
    this.pos = pos;
    this.neg = neg;
}

function While(cond, loop) {
    this.cond = cond;
    this.loop = loop;
}

function Native(func) {
    this.func = func;
}

export {
    Spawn,
    Dispatch,
    LoadName,
    LoadArg,
    LoadState,
    LoadContext,
    StoreName,
    StoreState,
    Return,
    If,
    While,
    Native,
}

// https://stackoverflow.com/a/14810722
const objectMap = (obj, fn) =>
    Object.fromEntries(
        Object.entries(obj).map(
            ([k, v], i) => [k, fn(v, k, i)]
        )
    )

Spawn.prototype.evaluate = function (teaCup) {
    return teaCup.spawn(this.watcher, objectMap(this.stateTable, function (expr) {
        return expr.evaluate(teaCup);
    }), this.dispatchTable);
}

Dispatch.prototype.evaluate = function (teaCup) {
    return teaCup.dispatch(
        this.receiver.evaluate(teaCup),
        this.message,
        this.args.map(function (arg) {
            return arg.evaluate(teaCup);
        })
    );
}

LoadName.prototype.evaluate = function (teaCup) {
    return teaCup.loadName(this.name);
}

LoadArg.prototype.evaluate = function (teaCup) {
    return teaCup.loadArg(this.index);
}

LoadState.prototype.evaluate = function (teaCup) {
    return teaCup.loadState(this.name);
}

LoadContext.prototype.evaluate = function (teaCup) {
    return teaCup.loadContext();
}

StoreName.prototype.process = function (teaCup) {
    teaCup.storeName(this.name, this.expr.evaluate(teaCup));
}

StoreState.prototype.process = function (teaCup) {
    teaCup.storeState(this.name, this.expr.evaluate(teaCup));
}

Return.prototype.process = function (teaCup) {
    teaCup.exitMethod(this.expr.evaluate(teaCup));
}

If.prototype.process = function (teaCup) {
    if (teaCup.evaluateCond(this.cond)) {
        teaCup.processStats(this.pos);
    } else {
        teaCup.processStats(this.neg);
    }
}

While.prototype.process = function (teaCup) {
    while (teaCup.evaluateCond(this.cond)) {
        teaCup.processStats(this.loop);
    }
}

Native.prototype.process = function (teaCup) {
    this.func(teaCup);
}