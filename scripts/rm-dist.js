"use strict"

const fs = require("fs")
const path = require("path")
const del = require("del")

let list

try {
    list = fs.readdirSync(path.resolve(__dirname, "../dist"))
} catch (e) {
    if (e.code !== "ENOENT") throw e
    process.exit()
}

for (const file of list) {
    if (/^\.git/i.test(file)) continue
    const resolved = path.posix.resolve(__dirname, "../dist", file)
    if (fs.statSync(resolved).isDirectory()) {
        del.sync(resolved)
    } else {
        fs.unlinkSync(resolved)
    }
}
