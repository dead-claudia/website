

*Edit (2016-01-14): minor typography/style/bug/etc. fixes.*

I recently made my first npm module ([babel-plugin-proto-to-create](http://npm.im/babel-plugin-proto-to-create)), but this just stems from my general frustration with class-based OO. Not saying it's a terrible thing at all, or that I can't understand it at all, but there's nothing simpler than objects linked to other objects. Nothing more elegant than this:

```js
const Vehicle = {
    new(make, model) {
        return {
            __proto__: this,
            make, model,
        }
    },

    toString() {
        return [
              "Type:  " + this.type,
              "Make:  " + this.make,
            "Model: " + this.model,
        ].join("\n")
    },
}

const Car = {
    __proto__: Vehicle,

    type: "Car",
}

const Truck = {
    __proto__: Vehicle,

    type: "Truck",
}
```

Merely creating an instance is as simple as this:

```js
let car = Car.new("Nissan", "Ultima")
```

I really love the simplicity of this, pure prototypal OO. It's simple, concise, and beautiful. Or, if you'd prefer, you could always use ES6 classes:

```js
class Vehicle {
    constructor(make, model) {
        this.make = make
        this.model = model
    }

    toString() {
        return [
              "Type:  " + this.type,
              "Make:  " + this.make,
            "Model: " + this.model,
        ].join("\n")
    }
}

class Car extends Vehicle {
    constructor(...args) {
        super(...args)
        this.type = "Car"
    }
}


class Truck extends Vehicle {
    constructor(...args) {
        super(...args)
        this.type = "Truck"
    }
}
```

Lot more boilerplate. Extending mixins in ES6 classes are also a little more complicated:

```js
function mixin(Class, ...srcs) {
    class C extends Class {}
    Object.assign(C.prototype, ...srcs)
    return C
}

class Foo extends mixin(Bar, Baz) {}

// Or, if you want to mixin classes...

function mixin(Class, ...others) {
    class C extends Class {}
    Object.assign(C.prototype, ...others.map(D => D.prototype))
    return C
}

class Foo extends mixin(Bar, Baz) {}
```

Why do classes, even JS prototype-based classes, have to be so complicated?

```js
function mixin(Type, ...others) {
    return Object.assign({__proto__: Type}, ...others)
}

const Foo = {
    __proto__: mixin(Bar, Baz),
}
```

And with ES7's object spread operator, the mixin picture is only going to make this nicer:

```js
const Type = {
    __proto__: Foo,
    ...Mixin1,
    ...Mixin2,

    method() {},
}
```

Very lightweight mixins that don't need any syntactical support. Not to mention you could even define these is-a/has-a relationships conditionally at object creation time:

```js
const Type = {
    new(condition) {
        return {
            __proto__: this,
            ...(condition ? Mixin1 : Mixin2),
        }
    }
}
```

I know of no other language with this kind of flexibility.
