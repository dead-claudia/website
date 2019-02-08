"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const chokidar = require("chokidar")

const util = require("../util")
const PugGenerator = require("./pug")

module.exports = class WatchingGenerator {
    constructor({
        glob, minified, template, once,
        on: events, ...options
    }) {
        this._pug = new PugGenerator(minified)
        this._map = new Map()
        this._renderCache = new Map()
        this._template = util.template(template)

        if (once) {
            if (options.disableGlobbing) {
                this._ready = util.pcall(cb => fs.access(glob, cb))
                    .then(() => events.add(glob))
            } else {
                this._ready = util.walk(glob, {
                    ignore: options.ignored,
                    cwd: options.cwd,
                    root: options.root,
                }, events.add)
            }
        } else {
            const watcher = chokidar.watch(glob, {
                awaitWriteFinish: true,
                ...options,
            })

            this._ready = util.once(watcher, "ready")
                .finally(() => watcher.on("error", console.error))

            for (const [key, listener] of Object.entries(events)) {
                watcher.on(key, (...args) => {
                    try {
                        listener(...args).catch(console.error)
                    } catch (e) {
                        console.error(e)
                    }
                })
            }
        }
    }

    async each(func) {
        await this._ready
        return Promise.all(Array.from(this._map.keys(), async url =>
            func(url, await this.renderURL(url))
        ))
    }

    _renderOpts() {
        throw new Error("This method is abstract!")
    }

    async renderURL(url) {
        await this._ready

        let rendered = this._renderCache.get(url)

        if (rendered == null) {
            const opts = this._map.get(url)

            if (opts == null) {
                const err = new Error("ENOENT: no such file or directory")

                err.code = "ENOENT"
                throw err
            }

            rendered = this._pug.generate(this._template, url,
                this._renderOpts(opts)
            )
        }

        return rendered
    }
}
