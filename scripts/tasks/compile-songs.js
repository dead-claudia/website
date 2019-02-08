"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// Asynchrony is only useful in terms of not waiting for I/O (which is in
// practice not much slower than the parsing).

const fs = require("fs")
const path = require("path")
const util = require("util")
const mkdirp = util.promisify(require("mkdirp"))

const SongGenerator = require("../generators/songs")
const {pcall} = require("../util")

const songs = new SongGenerator({minified: true, once: true})
const dist = path.resolve(__dirname, "../../dist")

songs.each(async (url, contents) => {
    const target = path.resolve(dist, url.slice(1))

    await mkdirp(path.dirname(target))
    await pcall(cb => fs.writeFile(target, contents, "utf-8", cb))
})
    .catch(err => { console.error(err.stack); return 1 })
    .then(process.exit)
