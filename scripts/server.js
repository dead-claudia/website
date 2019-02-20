"use strict"

const fs = require("fs")
const path = require("path")
const express = require("express")
const {pipeline} = require("stream")

const PugGenerator = require("./generators/pug")
const BlogGenerator = require("./generators/blog-posts")
const SongGenerator = require("./generators/songs")
const StylusGenerator = require("./generators/stylus")

const pug = new PugGenerator({minified: false, watching: true})
const blog = new BlogGenerator({minified: false, watching: true})
const songs = new SongGenerator({minified: false, watching: true})
const stylus = new StylusGenerator({minified: false, watching: true})
const app = express()

const root = path.resolve(__dirname, "../src/public")

function nocache(res) {
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Cache-Control", "no-cache,private,no-store," +
        "must-revalidate,max-stale=0,post-check=0,pre-check=0")
    res.setHeader("Expires", 0)
}

app.set("strict routing", true)
app.use((req, res, next) => {
    nocache(res)
    next()
})

app.use(require("morgan")("common"))

// Return a permission error on directory traversal
app.use((req, res, next) => {
    if (path.posix.join("/", req.path) !== req.path) return res.sendStatus(403)
    return next()
})

// README.md, /mixins/, /*.ignore/, *.pug
app.get(
    /\/README\.md|^\/mixins\/|^\/templates\/|\.pug/,
    (req, res) => res.sendStatus(404)
)

const renderBlog = (req, res, next) =>
    blog.renderPosts()
        .then(data => res.type("html").send(data))
        .catch(next)

app.get(/^\/music\/songs\/.*\.html$/, (req, res, next) =>
    songs.renderURL(req.path)
        .then(data => res.type("html").send(data))
        .catch(next)
)

app.get("/blog/atom.xml", (req, res, next) =>
    blog.renderFeed("atom-1.0")
        .then(data => res.type("xml").send(data))
        .catch(next)
)

app.get("/blog/rss.xml", (req, res, next) =>
    blog.renderFeed("rss-2.0")
        .then(data => res.type("xml").send(data))
        .catch(next)
)

app.get("/blog/index.html", renderBlog)

app.get(/^\/blog\/.*\.html$/, (req, res, next) =>
    blog.renderURL(req.path)
        .then(data => res.type("html").send(data))
        .catch(next)
)

app.get("*.html", (req, res) => res.type("html").send(pug.generate(
    path.resolve(root, req.path.replace(/\.html$/, ".pug")),
    req.path
)))

app.get("*.css", (req, res, next) =>
    stylus.renderURL(req.path)
        .then(data => res.type("css").send(data))
        .catch(next)
)

app.get("*.*", (req, res, next) => {
    const file = path.resolve(root, req.path.slice(1))

    return fs.stat(file, (err, stat) => {
        if (err != null) return next(err)
        if (!stat.isFile()) return res.redirect(`${req.baseUrl}${req.path}/`)
        return pipeline(
            fs.createReadStream(file),
            res.type(path.basename(file)).status(200)
        )
    })
})

// Wait until *after* everything is parsed before addressing the default route.
app.get("/blog/", renderBlog)

app.get("/", (req, res) => res.type("html").send(pug.generate(
    path.resolve(root, "index.pug"),
    "/index.html"
)))

app.get("*/", (req, res, next) => {
    const name = req.path.replace(/\/{2,}/g, "/").slice(0, -1)
    const file = path.resolve(root, name.slice(1))

    return fs.stat(file, (err, stat) => {
        if (err != null) return next(err)
        if (stat.isFile()) return next({code: "ENOENT"})

        return res.type("html").send(pug.generate(
            path.resolve(root, name.slice(1), "index.pug"),
            `${name}/index.html`
        ))
    })
})

app.use("*", (req, res) => res.sendStatus(404))
app.use("*", (err, req, res, next) => {
    console.log(err)
    if (err != null && (err.code === "ENOENT" || err.view != null)) {
        return res.sendStatus(404)
    } else {
        return next(err)
    }
})

app.listen(8080, () => {
    console.log("Server ready at http://localhost:8080")
})
