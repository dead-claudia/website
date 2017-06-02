"use strict"

// Pulled out into a separate file for parallelization.

const fs = require("fs")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")
const CleanCss = require("clean-css")

const pcall = require("./promise.js")

const infile = process.argv[2]
const outfile = process.argv[3].replace(/\.styl$/, ".css")

pcall(fs.readFile, infile, "utf-8")
.then(data => pcall(stylus.render, data, {
    "filename": infile,
    "include css": true,
    "use": [autoprefixer({browsers: ["last 2 versions", "> 5%"]})],
    "define": {url: stylus.resolver()},
}))
.then(res => new Promise(resolve => {
    return new CleanCss({
        processImport: false,
        roundingPrecision: -1,
    }).minify(res, (_, output) => resolve(output))
}))
.then(output => {
    output.errors.forEach(message => {
        console.error(`\x1B[31mERROR\x1B[39m: ${message}`)
    })

    output.warnings.forEach(message => {
        console.error(`WARNING: ${message}`)
    })

    if (output.errors.length) {
        return process.exit(1) // eslint-disable-line no-process-exit
    } else {
        return output.styles
    }
})
.then(styles => pcall(fs.writeFile, outfile, styles, "utf-8"))
.catch(err => {
    console.error(err.message)
    if (err.stack) {
        console.error(err.stack)
    }

    return process.exit(1) // eslint-disable-line no-process-exit
})
