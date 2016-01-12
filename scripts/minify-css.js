"use strict"

// Pulled out into a separate file for parallelization.

const p = require("./promise.js")

const path = require("path")
const fs = p.promisifyAll(require("fs"), ["readFile", "writeFile"])

const postcss = require("postcss")
const autoprefixer = require("autoprefixer")
const pimport = require("postcss-import")
const CleanCss = require("clean-css")
const reporter = require("postcss-reporter")

const infile = process.argv[2]
const outfile = process.argv[3]

fs.readFileAsync(infile, "utf-8")
.then(data => {
    return postcss()
    .use(pimport({
        path: path.resolve(__dirname, "../src"),
        async: true,
    }))
    .use(autoprefixer({browsers: ["last 2 versions, > 5%"]}))
    .use(reporter({
        clearMessages: true,
        throwError: true,
    }))
    .process(data, {from: infile, to: outfile})
    .catch(err => {
        /* eslint-disable max-len */
        // Show source code, but not the stack.
        // https://github.com/postcss/postcss/blob/master/docs/guidelines/runner.md#31-dont-show-js-stack-for-csssyntaxerror
        /* eslint-enable max-len */
        if (err.name === "CssSyntaxError") {
            err.stack = null
            err.message += err.showSourceCode()
        }
        throw err
    })
})
.then(res => new Promise(resolve => {
    return new CleanCss({
        processImport: false,
        roundingPrecision: -1,
    }).minify(res.css, (_, output) => resolve(output))
}))
.then(output => {
    output.errors.forEach(message => {
        console.error(`\x1B[31mERROR\x1B[39m: ${message}`)
    })

    output.warnings.forEach(message => {
        console.error(`WARNING: ${message}`)
    })

    if (output.errors.length) process.exit(1)
    return output.styles
})
.then(styles => fs.writeFileAsync(outfile, styles, "utf-8"))
.catch(err => {
    console.error(err.message)
    if (err.stack) console.error(err.stack)
    process.exit(1)
})
