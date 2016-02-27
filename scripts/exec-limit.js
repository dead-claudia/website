"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const spawn = require("child_process").spawn
const os = require("os")

// Limit the number of running processes to not kill the computer.
let processes = 0
const queue = []

exec.limit = os.cpus().length + 1

setInterval(() => {
    if (processes >= exec.limit || queue.length === 0) return undefined
    processes++

    const job = queue.shift()

    job.child = spawn(job.cmd, job.args, job.opts)
    job.child.on("exit", () => processes--)

    return run(job)
}, 0)

function format(cmd, args, code, signal) {
    for (const arg of args) {
        if (/[\x00-\x1F\s\x80-\uFFFF]/.test(arg)) {
            cmd += ` ${JSON.stringify(arg)}`
        } else {
            cmd += ` ${arg}`
        }
    }

    let res = `'${cmd}' exited with code ${code}.`

    if (signal) res = `Child killed with signal ${signal}.\n\n${res}`
    return {stack: res}
}

function call(job, prop, value) {
    if (typeof job[prop] !== "function") return undefined
    const callback = job[prop]

    job[prop] = undefined

    return callback(value)
}

function run(job) {
    call(job, "onopen", job.child)
    job.child.once("error", err => call(job, "reject", err))
    job.child.once("close", (code, signal) => {
        if (code || signal) {
            return call(job, "reject", format(job.cmd, job.args, code, signal))
        } else {
            return call(job, "resolve")
        }
    })
}

module.exports = exec
function exec(str, onopen, opts) {
    opts = opts || {}
    if (!opts.stdio) opts.stdio = "inherit"
    const args = Array.isArray(str) ? str : str.split(/\s+/g)
    const cmd = args.shift()

    return new Promise((resolve, reject) => {
        queue.push({cmd, args, onopen, resolve, reject, opts, child: null})
    })
}
