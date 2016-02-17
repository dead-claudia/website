"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const path = require("path").posix

function getAllMethods(obj) {
    return Object.getOwnPropertyNames(obj)
    .filter(key => key !== "constructor")
    .concat(Object.getOwnPropertySymbols(obj))
    .filter(key => typeof obj[key] === "function")
}

module.exports = class JadeLocals {
    constructor(FILE, minified) {
        this.FILE = FILE
        this.minified = minified

        // Bind all the functions on the prototype, so they can just be called.
        for (const key of getAllMethods(Object.getPrototypeOf(this))) {
            this[key] = this[key].bind(this)
        }
    }

    assert(cond, message, ErrorType) {
        if (ErrorType == null) ErrorType = Error
        if (!cond) throw new ErrorType(message)
    }

    resolve(url) {
        const ret = path.relative(path.dirname(this.FILE), url)

        // Minor size optimization
        return ret.slice(0, 2) === "./" ? ret.slice(2) : ret
    }

    navAttrs(href, file) {
        file = file || this.FILE
        if (file === href) {
            return {
                class: "selected",
                href: file !== this.FILE && this.resolve(href),
            }
        } else {
            return {href: this.resolve(href)}
        }
    }
}
