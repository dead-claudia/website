"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const path = require("path").posix
const cache = new Map()

function getRegExp(name) {
    if (cache.has(name)) return cache.get(name)

    const escaped = name.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
    const re = new RegExp(`\\b${escaped}\\b`)

    cache.set(name, re)
    return re
}

function checkType(object, name, type) {
    if (typeof object !== type) {
        const a = /^[aeiou]/.test(type) ? "an" : "a"

        throw new TypeError(`Expected ${name} to be ${a} ${type}`)
    }
}

module.exports = (FILE, minified) => {
    function resolve(url) {
        checkType(url, "url", "string")

        const ret = path.relative(path.dirname(FILE), url)

        // Minor size optimization
        return ret.slice(0, 2) === "./" ? ret.slice(2) : ret
    }

    return {
        FILE, minified, resolve,

        assert(cond, message, ErrorType) {
            if (ErrorType == null) ErrorType = Error
            if (!cond) throw new ErrorType(message)
        },

        navAttrs(href, file) {
            if (file == null) file = FILE

            checkType(href, "href", "string")
            checkType(file, "file", "string")

            if (file === href) {
                return {
                    class: "selected",
                    href: resolve(href),
                }
            } else {
                return {href: resolve(href)}
            }
        },

        hasClass(attrs, name) {
            checkType(attrs, "attrs", "object")
            checkType(name, "name", "string")
            return getRegExp(name).test(attrs)
        },
    }
}
