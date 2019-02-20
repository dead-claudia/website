"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")

const WatchingPugGenerator = require("./_watching-pug")
const compileMarkdown = require("../compile-markdown")
const {pcall} = require("../util")

module.exports = class SongGenerator extends WatchingPugGenerator {
    constructor(opts = {}) {
        super({
            ...opts,
            glob: path.resolve(__dirname, "../songs.yml"),
            template: "song.pug",
            disableGlobbing: true,
            addReceived: false,
        })
    }

    _resolve(name) {
        return name
    }

    _renderOpts(song) {
        return {song}
    }

    async _receive(type, url, file) {
        if (type === "unlink") return
        this.log("Recompiling songs")
        const songs = await pcall(cb => fs.readFile(file, "utf-8", cb))
        const data = yaml.safeLoad(songs)

        this._map.clear()
        this._renderCache.clear()

        for (const [name, song] of Object.entries(data)) {
            if (song.description) {
                song.description = compileMarkdown.html(
                    `${name} in ${file}`, song.description
                )
            }

            this._map.set(`/music/songs/${name}.html`, song)
        }
    }
}
