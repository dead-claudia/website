"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// Asynchrony is only useful in terms of not waiting for I/O (which is in
// practice not much slower than the parsing).

const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")

const p = require("./promise.js")
const generate = require("./generate-blog-posts.js")

const dist = path.resolve(__dirname, "../dist")
const resolve = path.resolve.bind(null, dist)

generate((file, contents, url) => {
    const md = resolve("blog", url)

    return p.call(mkdirp, path.dirname(md))
    .then(() => p.call(fs.writeFile, md, contents, "utf-8"))
})
.then(data => {
    const json = JSON.stringify({posts: data.posts})
    const atom = data.feed.render("atom-1.0")
    const rss = data.feed.render("rss-2.0")

    return Promise.all([
        p.call(fs.writeFile, resolve("blog.json"), json, "utf-8"),
        p.call(fs.writeFile, resolve("blog.atom.xml"), atom, "utf-8"),
        p.call(fs.writeFile, resolve("blog.rss.xml"), rss, "utf-8"),
    ])
})
.catch(err => {
    console.error(err.stack)
    process.exit(1) // eslint-disable-line no-process-exit
})
