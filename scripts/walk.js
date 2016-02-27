"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const p = require("./promise.js")

function flatten(list) {
    return [].concat.apply([], list.map(file =>
        Array.isArray(file) ? flatten(file) : [file]))
}

function walk(dir, ignore) {
    return p.call(fs.readdir, dir)
    .then(files => files.filter(file => !ignore || !ignore(file)))
    .then(files => files.map(file => path.join(dir, file)))
    .then(files => Promise.all(files.map(file => {
        return p.call(fs.stat, file).then(stat => {
            if (stat.isDirectory()) return walk(file, ignore)
            if (stat.isFile()) return file
            return []
        })
    })))
}

module.exports = (dir, ignore) => walk(dir, ignore).then(flatten)
