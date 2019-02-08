"use strict"

// Pulled out into a separate file for parallelization.

const fs = require("fs")
const util = require("util")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")
const CleanCss = require("clean-css")
const {pcall} = require("../util")

const infile = process.argv[2]
const outfile = process.argv[3].replace(/\.styl$/, ".css")

;(async () => {
    const data = await pcall(cb => fs.readFile(infile, "utf-8", cb))
    const res = await util.promisify(stylus.render)(data, {
        "filename": infile,
        "include css": true,
        "use": [autoprefixer({browsers: ["last 2 versions", "> 5%"]})],
        "define": {url: stylus.resolver()},
    })
    const output = await new CleanCss({
        compatibility: "ie9",
        returnPromise: true,
    }).minify(res)

    output.errors.forEach(message => {
        console.error(`\x1B[31mERROR\x1B[39m: ${message}`)
    })

    output.warnings.forEach(message => {
        console.error(`WARNING: ${message}`)
    })

    // eslint-disable-next-line no-process-exit
    if (output.errors.length) process.exit(1)
    await pcall(cb => fs.writeFile(outfile, output.styles, "utf-8", cb))
})().catch(err => {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
    return process.exit(1) // eslint-disable-line no-process-exit
})
