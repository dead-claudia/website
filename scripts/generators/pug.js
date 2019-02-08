"use strict"

const pugLocals = require("../pug-locals.js")
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

module.exports = class PugGenerator {
    constructor({minified} = {}) { this._minified = !!minified }
    generate(target, name, extras) {
        let result = pug.compileFile(target, {filename: target})(
            pugLocals(name, this._minified, extras)
        )

        if (this._minified) result = HTMLMinifier.minify(result, minifierOpts)
        return result
    }
}
