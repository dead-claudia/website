"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

function wrapTask(target, task) {
    const old = target[task]
    return () => {
        console.log(`*** Running task ${task} ***`)
        return old.call(target, target).then(() => {
            console.log(`*** Task ${task} completed successfully! ***`)
        })
    }
}

class Runner {
    constructor(target, args) {
        args = args || process.argv.slice(2)
        if (!args.length) args = ["default"]
        this.target = target
        this.args = args
        this.index = 0
        this.initTasks()
    }

    initTasks() {
        for (const task of Object.keys(this.target)) {
            this.target[task] = wrapTask(this.target, task)
        }
    }

    nextTask() {
        while (this.index < this.args.length) {
            const arg = this.args[this.index++]
            if (!{}.hasOwnProperty.call(this.target, arg)) {
                console.error(`*** Target '${arg}' does not exist! ***`)
                process.exit(1)
            }
            if (arg[0] !== "-") return arg
        }

        console.log("*** All tasks completed successfully! ***")
        process.exit()
    }

    next() {
        return this.target[this.nextTask()]()
        .then(() => this.next())
        .catch(err => {
            console.error(err.stack)
            process.exit(1)
        })
    }
}

module.exports = (target, args) => new Runner(target, args).next()
