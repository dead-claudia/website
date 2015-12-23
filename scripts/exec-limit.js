"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const spawn = require("child_process").spawn

// Limit the number of running processes to not kill the computer.
let processes = 0
const queue = []
exec.limit = require("os").cpus().length + 1

setInterval(() => {
    if (processes >= exec.limit || queue.length === 0) return
    processes++
    const job = queue.shift()
    job.child = spawn(job.cmd, job.args, job.opts)
    job.child.on("exit", () => processes--)
    return job.run()
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

class ExecJob {
    constructor(cmd, args, onopen, resolve, reject, opts) {
        this.cmd = cmd
        this.args = args
        this.onopen = onopen
        this.resolve = resolve
        this.reject = reject
        this.opts = opts
        this.child = null
    }

    call(prop) {
        return value => {
            if (this[prop] == null) return
            const callback = this[prop]
            this[prop] = null
            return callback(value)
        }
    }

    run() {
        new Promise((resolve, reject) => {
            this.child.once("error", reject)
            this.child.once("close", (code, signal) => {
                if (code || signal) {
                    return reject(format(this.cmd, this.args, code, signal))
                } else {
                    return resolve()
                }
            })
        })
        .then(this.call("resolve"), this.call("reject"))
        return this.call("onopen")(this.child)
    }
}

module.exports = exec
function exec(str, onopen, opts) {
    opts = opts || {}
    if (!opts.stdio) opts.stdio = "inherit"
    const args = Array.isArray(str) ? str : str.split(/\s+/g)
    const cmd = args.shift()
    return new Promise((resolve, reject) => {
        queue.push(new ExecJob(cmd, args, onopen, resolve, reject, opts))
    })
}
