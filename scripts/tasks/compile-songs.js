"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// Asynchrony is only useful in terms of not waiting for I/O (which is in
// practice not much slower than the parsing).

const {promises: fs} = require("fs")
const path = require("path")
const util = require("util")
const mkdirp = util.promisify(require("mkdirp"))

const generate = require("../generators/songs")

const dist = path.resolve(__dirname, "../../dist")
const resolve = path.resolve.bind(null, dist)

generate(true, async (song, page) => {
    const html = resolve(song.slice(1))

    await mkdirp(path.dirname(html))
    await fs.writeFile(html, page, "utf-8")
}).catch(err => {
    console.error(err.stack)
    process.exit(1) // eslint-disable-line no-process-exit
})
