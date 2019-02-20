"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const {template} = require("../util")
const WatchingGenerator = require("./_watching")
const PugGenerator = require("./pug")

module.exports = class WatchingPugGenerator extends WatchingGenerator {
    constructor({minified, template: name, ...rest}) {
        super(rest)
        this._pug = new PugGenerator(minified)
        this._template = template(name)
    }

    _renderOpts() {
        throw new Error("This method is abstract!")
    }

    async _render(url) {
        const opts = await this._map.get(url)

        if (opts == null) {
            const err = new Error(`ENOENT: url not available, read ${url}`)

            err.code = "ENOENT"
            throw err
        }

        return this._pug.generate(this._template, url,
            this._renderOpts(opts)
        )
    }
}
