"use strict"

// Pulled out into a separate file for parallelization.

const fs = require("fs")

const infile = process.argv[2]
// The second argument is a Pug file. That needs fixed.
const outfile = process.argv[3].replace(/\.pug$/, ".html")
const name = process.argv[4]

const generatePug = require("./generate-pug")

const FILE = `/${
    name
        .replace(/[\\\/]/g, "/")
        .replace(/^src(?:\/)|\.pug$/g, "")
}.html`

fs.writeFileSync(outfile, generatePug(infile, FILE, true), "utf-8")
