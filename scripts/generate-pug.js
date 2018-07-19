"use strict"

const pugLocals = require("./pug-locals.js")
const pug = require("pug")
const HTMLMinifier = require("html-minifier")

const minifierOpts = {
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
}

module.exports = (target, name, minified, extras) => {
    let result = pug.compileFile(target, {filename: target})(
        pugLocals(name, minified, extras)
    )

    if (minified) result = HTMLMinifier.minify(result, minifierOpts)
    return result
}
