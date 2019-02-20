"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const chokidar = require("chokidar")
const util = require("../util")

module.exports = class WatchingGenerator {
    constructor({glob, watching, addReceived, ...options}) {
        this._map = new Map()
        this._renderCache = new Map()
        this._addReceived = !!addReceived
        this._watching = watching

        const add = file => {
            const url = this._resolve(file)

            const p = new Promise(resolve => resolve(
                this._receive("change", url, file)
            ))

            if (this._addReceived) this._map.set(url, p)
            p.catch(console.error)
        }

        if (watching) {
            const watcher = chokidar.watch(glob, {
                awaitWriteFinish: true,
                ...options,
            })

            this._ready = util.once(watcher, "ready")
                .finally(() => watcher.on("error", console.error))

            watcher.on("add", add)

            watcher.on("change", file => {
                const url = this._resolve(file)

                if (this._addReceived) {
                    this._renderCache.delete(url)
                    this._map.delete(url)
                }

                const p = new Promise(resolve => resolve(
                    this._receive("change", url, file)
                ))

                if (this._addReceived) this._map.set(url, p)
                p.catch(console.error)
            })

            watcher.on("unlink", file => {
                const url = this._resolve(file)

                if (this._addReceived) {
                    this._renderCache.delete(url)
                    this._map.delete(url)
                }

                new Promise(resolve => resolve(
                    this._receive("unlink", url, file)
                )).catch(console.error)
            })
        } else if (options.disableGlobbing) {
            this._ready = util.pcall(cb => fs.access(glob, cb))
                .then(() => add(glob))
        } else {
            this._ready = util.walk(glob, {
                ignore: options.ignored,
                cwd: options.cwd,
                root: options.root,
            }, add)
        }
    }

    log(...args) {
        if (this._watching) console.log(...args)
    }

    async _receive() {
        throw new Error("This method is abstract!")
    }

    async each(func) {
        await this._ready
        return Promise.all(Array.from(this._map.keys(), async url =>
            func(url, await this.renderURL(url))
        ))
    }

    async _render() {
        throw new Error("This method is abstract!")
    }

    async renderURL(url) {
        await this._ready

        let rendered = this._renderCache.get(url)

        if (rendered == null) {
            rendered = new Promise(resolve => resolve(this._render(url)))
            this._renderCache.set(url, rendered)
        }

        return rendered
    }
}
