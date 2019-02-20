"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const {spawn} = require("child_process")
const os = require("os")
const path = require("path")
const {Glob} = require("glob")

exports.template = name => path.resolve(__dirname, "../src/templates", name)

exports.pcall = cb => new Promise((resolve, reject) => {
    cb((err, data) => err != null ? reject(err) : resolve(data))
})

exports.once = (emitter, event, opts) => {
    if (typeof event !== "symbol") event += ""
    return new Promise((resolve, reject) => {
        const onEvent = opts && opts.returnArray
            ? (...args) => emitValue(args)
            : emitValue

        emitter.addListener(event, onEvent)
        emitter.addListener("error", onError)

        function emitValue(value) {
            resolve(value)
            emitter.removeListener(event, onEvent)
            emitter.removeListener("error", onError)
        }

        function onError(err) {
            reject(err)
            emitter.removeListener(event, onEvent)
            emitter.removeListener("error", onError)
        }
    })
}

// Most of the complexity here is because it needs to await all the tasks'
// completion and abort on failure. Otherwise, it'd just be as simple as this:
// exports.walk = (glob, opts, func) => {
//     if (typeof opts === "function") { func = opts; opts = undefined }
//     return new Promise((resolve, reject) => {
//         const inst = new Glob(glob, {...opts, nodir: true})
//
//         inst.on(opts.stat ? "stat" : "match", func)
//         inst.on("error", reject)
//         inst.on("end", resolve)
//     })
// }
exports.walk = (glob, opts, func) => {
    if (typeof opts === "function") { func = opts; opts = undefined }
    return new Promise((resolve, reject) => {
        const realOpts = {nodir: true}

        // Thank you Glob, for being too stupid to consider value set to
        // `undefined` as equivalent to omitting the property altogether...
        if (opts != null) {
            for (const [key, value] of Object.entries(opts)) {
                if (value != null) realOpts[key] = value
            }
        }

        const inst = new Glob(glob, realOpts)
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

        inst.on(opts && opts.stat ? "stat" : "match", (...args) => {
            active++
            new Promise(resolve => resolve(func(...args))).then(advance, fail)
        })

        inst.on("error", fail)
        inst.on("end", advance)
    })
}

// Limit the number of running processes to not kill the computer.
const cpus = os.cpus().length
let active = 0
let limit = cpus + 1
const queue = []

function format(cmd, args, code, signal) {
    for (const arg of args) {
        if (/[^\x20-\x7f\S]/.test(arg)) {
            cmd += ` ${JSON.stringify(arg)}`
        } else {
            cmd += ` ${arg}`
        }
    }

    let res = `'${cmd}' exited with code ${code}.`

    if (signal) res = `Child killed with signal ${signal}.\n\n${res}`
    const error = new Error(res)

    error.stack = res
    return error
}

function noop() {}

function cycle() {
    if (queue.length) {
        const {cmd, args, opts, resolve} = queue.shift()

        run(cmd, args, opts, resolve)
    } else {
        active--
    }
}

function cycleThrow(err) {
    cycle()
    throw err
}

function run(cmd, args, opts, resolve) {
    function checkResult([code, signal]) {
        if (code || signal) throw format(cmd, args, code, signal)
    }

    const child = spawn(cmd, args, {stdio: "inherit", ...opts})
    const promise = Promise.all([
        exports.once(child, "exit", {returnArray: true}).then(checkResult),
        exports.once(child, "close", {returnArray: true}).then(checkResult),
    ])

    resolve(promise.then(noop))
    promise.then(cycle, cycleThrow)

    if (opts && typeof opts.onopen === "function") opts.onopen(child)
}

exports.exec = (cmd, args, opts) => new Promise(resolve => {
    if (active === limit) {
        queue.push({cmd, args, opts, resolve})
    } else {
        active++
        run(cmd, args, opts, resolve)
    }
})

exports.setProcessLimit = newLimit => {
    limit = Math.floor(newLimit(cpus))
}
