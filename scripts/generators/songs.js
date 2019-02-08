"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")

const WatchingGenerator = require("./_watching")
const compileMarkdown = require("../compile-markdown")
const {pcall} = require("../util")

const songsFile = path.resolve(__dirname, "../songs.yml")

module.exports = class SongGenerator extends WatchingGenerator {
    constructor(opts = {}) {
        super({
            ...opts,
            glob: songsFile,
            template: "song.pug",
            disableGlobbing: true,
            on: {
                add: () => this._compileSongs(),
                change: () => this._compileSongs(),
            },
        })
    }

    _renderOpts(song) {
        return {song}
    }

    async _compileSongs() {
        const songs = await pcall(cb => fs.readFile(songsFile, "utf-8", cb))
        const data = yaml.safeLoad(songs)

        this._map.clear()
        this._renderCache.clear()

        for (const [name, song] of Object.entries(data)) {
            if (song.description) {
                song.description = compileMarkdown.html(
                    `${name} in ${songsFile}`, song.description
                )
            }

            this._map.set(`/music/songs/${name}.html`, song)
        }
    }
}
