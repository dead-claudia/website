"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// Asynchrony is only useful in terms of not waiting for I/O (which is in
// practice not much slower than the parsing).

// This does incorporate several elements from
// https://github.com/j201/meta-marked, but it doesn't actually *render* the
// markdown into HTML, as that's deferred to the browser.

const p = require("./promise.js")
const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const generate = require("./generate-blog-posts.js")

const distDir = path.resolve(__dirname, "../dist")
const json = path.resolve(distDir, "blog.json")

generate((file, contents, url) => {
    const dest = path.resolve(distDir, "blog", url)

    // TODO: compile single blog post to Jade and then to HTML

    return p.call(mkdirp, path.dirname(dest))
    .then(() => p.call(fs.writeFile, dest, contents, "utf-8"))
})
.then(data => {
    const serialized = JSON.stringify({posts: data.posts})

    return p.call(fs.writeFile, json, serialized, "utf-8")
})
.catch(err => {
    console.error(err.stack)
    process.exit(1) // eslint-disable-line no-process-exit
})
