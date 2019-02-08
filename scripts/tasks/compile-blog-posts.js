"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// Asynchrony is only useful in terms of not waiting for I/O (which is in
// practice not much slower than the parsing).

const fs = require("fs")
const path = require("path")
const util = require("util")
const mkdirp = util.promisify(require("mkdirp"))

const BlogGenerator = require("../generators/blog-posts")
const {pcall} = require("../util")

const dist = path.resolve(__dirname, "../../dist")
const emit = (file, data) => pcall(cb =>
    fs.writeFile(path.resolve(dist, file), data, "utf-8", cb)
)

const blog = new BlogGenerator({minified: true, once: true})

Promise.all([
    blog.renderPosts().then(data => emit("blog/index.html", data)),
    blog.renderFeed("atom-1.0").then(data => emit("blog/atom.xml", data)),
    blog.renderFeed("rss-2.0").then(data => emit("blog/rss.xml", data)),
])
    .then(() => blog.each(async (url, contents) => {
        const target = path.resolve(dist, url.slice(1))

        await mkdirp(path.dirname(target))
        await pcall(cb => fs.writeFile(target, contents, "utf-8", cb))
    }))
    .catch(err => { console.error(err.stack); return 1 })
    .then(process.exit)
