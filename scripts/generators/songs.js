"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const {promises: fs} = require("fs")
const path = require("path")
const yaml = require("js-yaml")

const compileMarkdown = require("../compile-markdown")
const generatePug = require("./pug")

const songsFile = path.resolve(__dirname, "../songs.yml")
const songsTemplate = path.resolve(__dirname, "../../src/templates/song.pug")
let songsMtime = 0

async function generateSongs(minified, write) {
    const songs = await fs.readFile(songsFile)
    const data = yaml.safeLoad(songs)
    const cache = new Map()

    for (const [name, song] of Object.entries(data)) {
        const url = `/music/songs/${name}.html`

        if (song.description) {
            song.description = compileMarkdown.html(
                `${name} in ${songsFile}`, song.description
            )
        }

        const html = generatePug(songsTemplate, url, minified, {song})

        cache.set(url, html)
        if (write) await write(url, html)
    }

    return cache
}

// Cache this, so the server isn't recompiling each file on every request.
let songCache

module.exports = async (minified, write) => {
    const stat = await fs.stat(songsFile)

    if (stat.mtime > songsMtime) {
        songsMtime = stat.mtime
        await (songCache = generateSongs(minified, write))
    }

    return songCache
}
