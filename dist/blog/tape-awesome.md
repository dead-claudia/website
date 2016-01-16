

*Edit (2016-01-16): minor typography/style/bug/etc. fixes.*

[`tape`](http://npm.im/tape) is awesome. Nobody likes writing thousands and
thousands of lines of unit tests, but I'd have to say that tape makes it easy.
It takes a lot less time and code to write the tests. Compare these two
assertions in Mocha and tape:

(I'll shamelessly admit I yanked these from Mocha's website.)

```js
// Mocha
var assert = require("assert")
describe('Array', () => {
    describe('#indexOf()', () => {
        it('returns -1 when the value is not present', () => {
            assert.equal(-1, [1,2,3].indexOf(5))
        })

        it('returns the index when the value is present', () => {
            assert.equal(2, [1,2,3].indexOf(3))
        })
    })
})

// tape
var t = require('tape')
t.test('Array', t => {
    t.test('#indexOf()', t => {
        t.equal(-1, [1,2,3].indexOf(5), 'returns -1 when the value is not present')
        t.equal(2, [1,2,3].indexOf(3), 'returns the index when the value is present')
    })
})
```

Also, if you're dealing with asynchronous code, it's just as easy.

```js
// Mocha
describe('User', () => {
    describe('#save()', () => {
        it('saves without error', done => {
            var user = new User('Luna')
            user.save(done)
        })
    })
})

// tape
var t = require('tape')
t.test('User', t => {
    t.test('#save()', t => {
        t.test('saves without error', t => {
            t.plan(1)
            var user = new User('Luna')
            user.save(err => t.end(err))
        })
    })
})
```

The beauty of all of this is that it's so simple. You also don't have any global
pollution. The tape tests can be run with node test.js. The tape command line
runner does this very thing; it just runs the directory recursively when given
one. And as for pretty output,
[there's a lot of tools out there](https://www.npmjs.com/package/tape#pretty-reporters)
that only need piped into. If you like the output of a C program that accepts it
from stdin, you can use that reporter as well. No opinions needed.
