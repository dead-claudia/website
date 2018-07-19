"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// Asynchrony is only useful in terms of not waiting for I/O (which is in
// practice not much slower than the parsing).

const {promises: fs} = require("fs")
const path = require("path")
const util = require("util")
const mkdirp = util.promisify(require("mkdirp"))

const generate = require("./generate-blog-posts.js")
const generatePug = require("./generate-pug")

const dist = path.resolve(__dirname, "../dist")
const resolve = path.resolve.bind(null, dist)

;(async () => {
    const {posts, feed} = await generate(true, async (file, post, page) => {
        const html = resolve(post.url.slice(1)).replace(/\.md$/, ".html")

        await mkdirp(path.dirname(html))
        await fs.writeFile(html, page, "utf-8")
    })

    const atom = feed.render("atom-1.0")
    const rss = feed.render("rss-2.0")
    const html = generatePug(
        path.resolve(__dirname, "../src/mixins/blog.pug"),
        "/blog/index.html", true, {posts}
    )

    await Promise.all([
        fs.writeFile(resolve("blog/index.html"), html, "utf-8"),
        fs.writeFile(resolve("blog/atom.xml"), atom, "utf-8"),
        fs.writeFile(resolve("blog/rss.xml"), rss, "utf-8"),
    ])
})().catch(err => {
    console.error(err.stack)
    process.exit(1) // eslint-disable-line no-process-exit
})
