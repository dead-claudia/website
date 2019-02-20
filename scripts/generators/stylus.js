"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")
const CleanCss = require("clean-css")

const WatchingGenerator = require("./_watching")
const {pcall} = require("../util")

const srcDir = path.resolve(__dirname, "../../src/public")
const urlResolver = stylus.resolver()
const autoprefixerPlugin = autoprefixer({browsers: ["last 2 versions", "> 5%"]})

module.exports = class StylusGenerator extends WatchingGenerator {
    constructor({minified, ...rest}) {
        super({
            ...rest,
            glob: "**/*.styl",
            cwd: srcDir,
            root: srcDir,
            ignored: ["mixins/**", "templates/**"],
            addReceived: true,
        })

        this._minified = minified
    }

    _resolve(name) {
        return `/${name.replace(/\.styl$/, ".css")}`
    }

    async _receive(type, file) {
        if (type === "add") this.log(`Stylesheet added: ${file}`)
        else if (type === "change") this.log(`Stylesheet changed: ${file}`)
        else this.log(`Stylesheet deleted: ${file}`)
        return true
    }

    async _render(url) {
        const stylUrl = url.slice(1).replace(/\.css$/, ".styl")
        const file = path.resolve(srcDir, stylUrl)
        const data = await pcall(cb => fs.readFile(file, "utf-8", cb))

        const transpiled = await pcall(cb => stylus.render(data, {
            "filename": file,
            "include css": true,
            "use": [autoprefixerPlugin],
            "define": {url: urlResolver},
        }, cb))

        if (!this._minified) return transpiled

        const output = await new CleanCss({
            compatibility: "ie9",
            returnPromise: true,
        }).minify(transpiled)

        if (output.errors.length || output.warnings.length) {
            for (const message of output.errors) {
                console.error(`\x1B[31mERROR\x1B[39m: ${message}`)
            }

            for (const message of output.warnings) {
                console.error(`WARNING: ${message}`)
            }

            throw new Error(
                "CleanCSS errors occurred. See console for details."
            )
        }

        return output.styles
    }
}
