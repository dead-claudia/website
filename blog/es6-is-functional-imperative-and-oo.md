---
title: ES6 is functional, imperative, and OO
date: 2014-11-09
tags:
    - javascript
    - es6
    - object oriented
    - functional programming
    - opinions
---

*Edit (2016-01-14): minor typography/style/bug/etc. fixes.*

Yes, I know that, lately, there has been a fad about functional programming. Examples include C++ and Python getting lambdas, people envying those with Haskell/OCaml/etc. experience, and so on. But, in my experience, JavaScript has always been in the grey area. It's been called functional, imperative, "Lisp in C's clothing", object oriented, and so many other things. Yet, none of these actually describe the language, which is, in reality, a mixture of all these things.

Now, here's why I believe ES6 to be functional, imperative, and object oriented, all three.

## Functional

---

ES6 has a new arrow function syntax, one most JavaScript programmers who have been keeping up already know pretty well.

```js
let f1 = x => doSomething(x);
let f2 = (x, y) => doSomething(x, y);
let f3 = () => doSomething();

let identity = x => x;
let noop = () => {};
```

This is generally considered functional, but combine it with `Array.prototype.map` or `Array.prototype.reduce`, and it'll start really looking more functional:

```js
// generically
let doubleGeneric = xs => Array.prototype.map.call(xs, x => x*2);
let doubleArray = xs => xs.map(x => x*2);

let sum = xs => xs.reduce((x, y) => x+y);
```

As you might have already noticed in the above examples, some of the `Array.prototype` methods are more generic as well.

Also, the two Underscore methods map and each could become a lot simpler to write:

```js
function* range(n) {
    for (let i = 0; i < n; i++)
        yield i;
}

export const map = (xs, fn) => {
    let array = [];
    for (let i of range(n))
        array.push(fn(xs[i], i));
    return array;
};

export const each = (xs, fn) => {
    for (let i of range(x)) {
        fn(xs[i], i);
    }
};
```

You could always use Array.from in each of these cases as well, making them far smaller and a little more functional (albeit a little slower):

```js
export const map = (xs, fn) => Array.from(xs).map(fn);
export const each = (xs, fn) => Array.from(xs).each(fn);
```

There are also Promises, already known to be monads, and they're now in the standard library. It is easy to make a promisifying function for Node-style callbacks:

```js
function promisify(fn) {
    return (...args) => new Promise((resolve, reject) =>
        fn(...args, (err, ...retArgs) =>
            err != null ?
                reject(err) :
                resolve(...retArgs)));
}

// Example
let fs = require('fs');
let readFile = promisify(fs.readFile);

readFile('foo.txt')
    .then(data => doSomething(data))
    .catch(err => console.error(err));
```

There are also generators, which are lazy, while Arrays are eager. You can write equivalents to most Array.prototype methods easily for generators.

```js
function* map(gen, fn) {
    let i = 0;
    for (let val of gen)
        yield fn(val, i++);
}

function each(gen, fn) {
    let i = 0;
    for (let val of gen)
        fn(val, i++);
}

function reduce(gen, fn) {
    gen = Generator(gen); // shallow copy
    let last = gen.next().value;
    let res = last;
    for (let val of gen)
        [res, last] = [fn(val, last), val];
    return res;
}

// Array.prototype.contains is ES7-specific
function contains(gen, ...vals) {
    for (let i of gen) {
        if (vals.contains(i))
            return true;
    }
    return false;
}

function* filter(fn) {
    let i = 0;
    for (let val of gen) {
        if (fn(val, i))
            yield val
    }
}

// etc...
```

I can't end this section properly without at least mentioning the new Array methods:

-   `[].copyWithin(target, start, end = this.length)` ‒ Copies entries in-place from the range `start` to `end` to the range of same length starting at `target`. Example:

    ```js
    [1, 2, 3, 4, 5].copyWithin(0, 3) //=> [4, 5, 1, 2, 3]
    ```

-   `[].entries()` ‒ Returns an iterator (like a generator) for the array.

-   `[].find(fn)` ‒ Returns the first entry that `fn` returns `true` for, `undefined` otherwise.

-   `[].findIndex(fn)` ‒ Like `[].indexOf(val)`, but for functions. Returns the first index that `fn` returns true for, -1 otherwise.

-   `[].keys()`, `[].values()` ‒ Mainly for consistency with `Map.prototype.keys()`, `Map.prototype.values()`, and the `Set` equivalents.

## Imperative

---

It is already pretty well established that JavaScript has its imperative components. There is no reason to cover this in detail; just look at some of the examples above. Sometimes, you have no choice but to split things into separate statements.

## Object-Oriented

---

Yes, JavaScript has always been object-oriented since its creation, and it is well known that ES6 has its own class syntax.

```js
class Foo {
    constructor(arg) {
        this.bar = arg;
    }

    sayBar() {
        console.log(this.bar);
    }
}

class Bar extends Foo {
    constructor(x, ...args) {
        super(...args);
        this.x = x;
    }
}

let bar = new Bar(1, 3);
bar.sayBar(); // prints '3' to console
bar.x; // 1
```

But, the new syntax also builds on JavaScript's object-oriented nature substantially. Now, there are also static methods you can add to classes, and it is easier to extend classes (like above), so ES6 classes are a lot more declarative, clear, and concise. You can even subclass builtins now.

```js
class Baz extends Foo {
    static from(obj) {
        return new Baz(obj.bar);
    }
}

// Even this is allowed.
class MyArray extends Array {
    constructor(prop, ...args) {
        super(...args);
        this.prop = prop;
    }
}
```

## Conclusion

ES6 will add to the confusion of what JavaScript really is, albeit in an awesome way. There are three primary categories people typically try to lump JavaScript into, and they're all (mostly) right:

-   Functional: arrow functions, more generic Array methods, some new Array methods, lazy generators.

-   Imperative: relatively self-explanatory.

-   Object-oriented: simpler class declaration syntax, more deeply integrated with the language, may make more parts of the DOM possible to implement in JavaScript.

    -   DOM Level 4 will replace HTMLCollections and NodeLists with Elements, an
        actual ES6-style Array subclass with two additional methods: `Elements.prototype.query()` (like `Element.prototype.querySelector()`) and `Elements.prototype.queryAll()` (like `Element.prototype.querySelectorAll()`). This will make the DOM even easier to work with and an even better fit for both functional and OO programming.
