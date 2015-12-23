"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const p = require("./promise.js")
const fs = p.promisifyAll(require("fs"), ["stat", "readdir"])
const path = require("path")

function flatten(list) {
    return [].concat.apply([], list.map(file =>
        Array.isArray(file) ? flatten(file) : [file]))
}

function walk(dir, ignore) {
    return fs.readdirAsync(dir)
    .then(files => files.filter(file => !ignore || !ignore(file)))
    .then(files => files.map(file => path.join(dir, file)))
    .then(files => Promise.all(files.map(file => {
        return fs.statAsync(file).then(stat => {
            if (stat.isDirectory()) return walk(file, ignore)
            if (stat.isFile()) return file
            return []
        })
    })))
}

module.exports = function (dir, ignore) {
    return walk(dir, ignore).then(flatten)
}
