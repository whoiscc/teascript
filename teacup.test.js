import TeaCup from "./teacup";
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
    While
} from "./syntax";

test('create TeaCup instance', () => {
    const cup = new TeaCup();
    cup.spawn(null, {}, {});
})

test('dispatch message', () => {
    const cup = new TeaCup();
    const watcher = cup.spawn(null, {}, {
        getAnswer: [
            new Native(function (cup) {
                cup.exitMethod(42);
            })
        ]
    });
    const object = cup.spawn(watcher, {}, {});
    const answer = cup.dispatch(object, 'getAnswer', []);
    expect(answer).toEqual(42);
})

test('access internal state', () => {
    const cup = new TeaCup();
    const object = cup.spawn(null, {counter: 0}, {
        increase: [
            new StoreState('counter', new Dispatch(
                new LoadContext(), '$nativeAddOne', [new LoadState('counter')])),
            new Return(new LoadContext()),
        ],
        $nativeAddOne: [
            new Native(function (cup) {
                const n = cup.loadArg(0);
                cup.exitMethod(n + 1);
            })
        ]
    });
    cup.dispatch(object, 'increase', []);
    expect(object.stateTable.counter).toEqual(1);
    cup.dispatch(object, 'increase', []);
    expect(object.stateTable.counter).toEqual(2);
})

test('access name scope', () => {
    const cup = new TeaCup();
    const object = cup.spawn(null, {}, {
        getAnswer: [
            new StoreName('x', new Dispatch(
                new LoadContext(), '$nativeGetAnswer', [])),
            new Return(new LoadName('x')),
        ],
        $nativeGetAnswer: [
            new Native(function (cup) {
                cup.exitMethod(42);
            })
        ]
    });
    const answer = cup.dispatch(object, 'getAnswer', []);
    expect(answer).toEqual(42);
})

test('create cat with name', () => {
    const cup = new TeaCup();
    const cat = cup.spawn(null, {}, {
        'new': [
            new Return(new Spawn(new LoadContext(), {
                name: new LoadArg(0),
            }, {
                setName: [
                    new StoreState('name', new LoadArg(0)),
                    new Return(new LoadContext()),
                ]
            })),
        ]
    });
    const aCat = cup.dispatch(cat, 'new', ['catsay']);
    expect(aCat.stateTable.name).toEqual('catsay');
    const result = cup.dispatch(aCat, 'setName', ['serena']);
    expect(aCat.stateTable.name).toEqual('serena');
    expect(result).toBe(aCat);
})

test('if and while stats', () => {
    const cup = new TeaCup();
    const object = cup.spawn(null, {}, {
        testFunc: [
            new StoreName('x', new Dispatch(new LoadContext(), '$nativeGetZero', [])),
            new While(new Dispatch(
                new LoadContext(), '$nativeLessThan', [
                    new LoadName('x'), new LoadArg(0)
                ]), [
                    new If(new Dispatch(
                        new LoadContext(), '$nativeLessThan', [
                            new LoadArg(1), new LoadName('x'),
                        ]),
                        [
                            new Return(new LoadName('x')),
                        ], []
                    ),
                    new StoreName('x', new Dispatch(
                        new LoadContext(), '$nativeAddOne', [new LoadName('x')])),
                ]
            ),
            new Return(new LoadName('x')),
        ],
        $nativeGetZero: [
            new Native(function (cup) {
                cup.exitMethod(0);
            }),
        ],
        $nativeLessThan: [
            new Native(function (cup) {
                let result = cup.loadArg(0) < cup.loadArg(1);
                cup.exitMethod(cup.spawn(null, {}, {
                    $nativeBool: [
                        new Native(function (cup) {
                            cup.exitMethod(result);
                        })
                    ]
                }));
            })
        ],
        $nativeAddOne: [
            new Native(function (cup) {
                cup.exitMethod(cup.loadArg(0) + 1);
            })
        ]
    });
    expect(cup.dispatch(object, 'testFunc', [10, 20])).toEqual(10);
    expect(cup.dispatch(object, 'testFunc', [20, 10])).toEqual(11);
})

test('break and continue - too complex to test without frontend', () => {
})