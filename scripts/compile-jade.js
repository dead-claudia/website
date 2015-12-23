"use strict"

// Pulled out into a separate file for parallelization.

const fs = require("fs")

const infile = process.argv[2]
// The second argument is a Jade file. That needs fixed.
const outfile = process.argv[3].replace(/\.jade$/, ".html")
const name = process.argv[4]

const FILE = name
    .replace(/\.jade$/, ".html")
    .replace(/[\\\/]|/g, "/")
    .replace(/^src(?:\/)/g, "")

try {
    const src = require("jade").compileFile(infile, {filename: infile})({
        // Convert backslashes on Windows to Web-style, losing the `src/`
        FILE: `/${FILE}`,
        minified: true,
    })

    const minified = require("html-minifier").minify(src, {
        removeComments: true,
        removeCommentsFromCdata: true,
        removeCdatasectionsFromCdata: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        preserveLineBreaks: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeOptionalTags: true,
        minifyJs: true,
        minifyCss: true,
        minifyUrls: true,
    })

    fs.writeFileSync(outfile, minified, "utf-8")
} catch (e) {
    // TODO: try to figure out why this runs twice when Jade throws, but only
    // when run through the build process. I can't repro it by simply running
    // the same command from a shell. It's clearly a bug in V8, triggered by
    // something in Node's internals.
    console.error(e.stack)
    process.exit(1)
}
