"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

module.exports = async tasks => {
    function bail(message) {
        console.error(message)
        return process.exit(1) // eslint-disable-line no-process-exit
    }

    const args = process.argv.length > 2 ? process.argv.slice(2) : ["default"]
    const done = new Set()

    async function run(task) {
        if (done.has(task)) return
        done.add(task)

        if (typeof tasks[task] !== "function") {
            bail(`*** Target '${task}' does not exist! ***`)
        }

        console.log(`*** Running task ${task} ***`)
        await tasks[task](run)
        console.log(`*** Task ${task} completed successfully! ***`)
    }

    try {
        for (const task of args) {
            if (task[0] !== "-") await run(task)
        }

        console.log("*** All tasks completed successfully! ***")
    } catch (e) {
        bail(e.stack)
    }
}
