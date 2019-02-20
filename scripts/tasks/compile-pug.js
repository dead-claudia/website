#!/usr/bin/env node
"use strict"

// Pulled out into a separate file for parallelization.

const fs = require("fs")

const infile = process.argv[2]
// The second argument is a Pug file. That needs fixed.
const outfile = process.argv[3].replace(/\.pug$/, ".html")
const name = process.argv[4]

console.log(`Compiling file: ${name}`)

const PugGenerator = require("../generators/pug")
const pug = new PugGenerator({minified: true})

const FILE = `/${
    name
        .replace(/[\\\/]/g, "/")
        .replace(/^src\/public(?:\/)|\.pug$/g, "")
}.html`

fs.writeFileSync(outfile, pug.generate(infile, FILE), "utf-8")
