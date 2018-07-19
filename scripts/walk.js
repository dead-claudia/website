"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const {Glob} = require("glob")

module.exports = (glob, opts, func) => {
    if (typeof opts === "function") {
        func = opts
        opts = undefined
    }
    if (opts == null) opts = {}
    opts.nodir = true

    return new Promise((resolve, reject) => {
        const inst = new Glob(glob, opts)
        let active = 1

        function advance() {
            if (active === 0) return
            active--
            if (active === 0) resolve()
        }

        function fail(e) {
            if (active === 0) return
            active = 0
            reject(e)
            inst.abort()
        }

        inst.on(opts.stat ? "stat" : "match", (...args) => {
            active++
            new Promise(resolve => resolve(func(...args))).then(advance, fail)
        })

        inst.on("error", fail)
        inst.on("end", advance)
    })
}
