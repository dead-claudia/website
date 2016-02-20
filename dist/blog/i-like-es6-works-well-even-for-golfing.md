

*Edit (2016-01-14): Remove license disclaimer, re-license it under site's
general license. I also fixed typography/grammar/bugs/clarity/etc. throughout.*

*Update: updated much of the code, made the JS smaller and the assembly half the
instruction size. Also fixed the max line length for comments to 80 characters.*

Most of you all probably already understand basic JavaScript and the factorial
function. Here's the canonical recursive implementation in JavaScript:

```js
// Function declaration
function fact(n) {
    if (x > 0) {
        return n * factorial(n - 1);
    } else {
        return 1;
    }
}

// ES6 arrow function
let fact = n => n > 0 ? n * fact(n - 1) : 1;
```

But, I find this hack fairly cool: it basically ~~abuses~~takes enormous
advantage of precedence and how logic statements work in ECMAScript. The hack
assumes integer input.

```js
// Function declaration
function fact(n) {
    return +(n < 1) || n * fact(n - 1);
}

// ES6 arrow function
let fact = n => +(n < 1) || n * fact(n - 1);
```

The hack version also takes advantage of an implicit boolean-to-integer cast,
which is usually much shorter than a conditional. Code golfing is a little fun
for these kinds of hacks, so let's compare a golfed C/C++ version to this
ECMAScript hack unminified (using the ES6 versions):

```js
// Golfed C/C++
int f(int n){int r=1;while(n--)r*=n;return r;}

// Unminified ES6 arrow function
let fact = n => +(n < 1) || n * fact(n - 1);

// Unminified function declaration
function fact(n) { return +(n < 1) || n * fact(n - 1); }
```

And minified:

```js
// C/C++
int f(int n){int r=1;while(n--)r*=n;return r;}

// Minified function declaration
function f(n){return +(n<=0)||n*f(n-1)}

// Minified ES6
let f=n=>+(n<1)||n*f(n-1);
```

Here's an explanation of the hack, comments inline:

```js
// This would probably work in Netscape.
function fact(n) {
    return +(n < 1) // This implicitly casts from boolean to integer, retaining
                    // truthiness. If true, this returns 1 and does not evaluate
                    // the right side.
            ||      // If falsy, evaluate and return the next part.
            n * fact(n - 1); // Standard recursion
}
```

Here's the function without comments again:


```js
function fact(n) {
    return +(n <= 0) || n * fact(n - 1);
}

let fact = n => +(n <= 0) || n * fact(n - 1);
```

You'll never beat assembly in speed, though... (this is written for x86 using
NASM syntax)

```asm
; And almost in size...this is surprisingly short. Uses the cdecl calling
; convention.
fact
    pop ecx
    mov eax, 1
.fact:
    mul ecx
    loop .fact
    ret
```
