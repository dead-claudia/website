"use strict"

// Pulled out into a separate file for parallelization.

const path = require("path")
const fs = require("fs")

const browserify = require("browserify")

const cp = require("child_process")

const infile = path.resolve(__dirname, "../src/blog.ignore/index.js")
const outfile = path.resolve(__dirname, "../dist/blog.js")

function error(err) {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
}

const watch = ee => ee.on("error", error)

const bundle = watch(browserify(infile).transform("uglifyify").bundle())

const uglifyjs = watch(cp.spawn("uglifyjs", ["-cm"]))
watch(bundle).pipe(watch(uglifyjs.stdin))

let stderr = ""
watch(uglifyjs.stderr).on("data", data => stderr += data.toString("utf8"))

uglifyjs.on("exit", code => {
    if (code) {
        console.error(`'uglifyjs -cm' exited with code ${code}.`)
        console.error(stderr)
        process.exit(code)
    }
})

watch(uglifyjs.stdout).pipe(watch(fs.createWriteStream(outfile)))
