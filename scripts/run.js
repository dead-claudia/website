"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

function bail(message) {
    console.error(message)
    return process.exit(1) // eslint-disable-line no-process-exit
}

module.exports = (target, args) => {
    args = args || process.argv.slice(2)
    if (!args.length) args = ["default"]

    let index = 0

    for (const task of Object.keys(target)) {
        const old = target[task]

        target[task] = () => {
            console.log(`*** Running task ${task} ***`)
            return old.call(target, target).then(() => {
                console.log(`*** Task ${task} completed successfully! ***`)
            })
        }
    }

    const next = () => target[nextTask()]().then(next, err => bail(err.stack))

    function nextTask() {
        if (index >= args.length) {
            console.log("*** All tasks completed successfully! ***")
            return process.exit() // eslint-disable-line no-process-exit
        }

        const arg = args[index++]

        if (!{}.hasOwnProperty.call(target, arg)) {
            return bail(`*** Target '${arg}' does not exist! ***`)
        }

        return arg[0] !== "-" ? arg : nextTask()
    }

    return next()
}
