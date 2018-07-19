"use strict"

const fs = require("fs")
const path = require("path")
const express = require("express")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")
const {pipeline} = require("stream")

const pugLocals = require("./pug-locals.js")
const generatePug = require("./generate-pug.js")
const generateBlog = require("./generate-blog-posts.js")

const app = express()

function nocache(res) {
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Cache-Control", "no-cache,private,no-store," +
        "must-revalidate,max-stale=0,post-check=0,pre-check=0")
    res.setHeader("Expires", 0)
}

app.set("views", "src")
app.set("view engine", "pug")
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

// README.md, /mixins/, /*.ignore/, *.pug, .ignore.*
app.get(
    /\/README\.md|^\/mixins\/|\.pug|\.ignore[\/\.]/,
    (req, res) => res.sendStatus(404))

function withBlog(render) {
    return (req, res, next) =>
        generateBlog(false).then(data => render(req, res, data)).catch(next)
}

const renderBlog = withBlog((req, res, data) =>
    res.type("html").send(generatePug(
        path.resolve(__dirname, "../src/mixins/blog.pug"),
        req.path, false, {posts: data.posts}
    ))
)

app.get("/blog/atom.xml", withBlog((req, res, data) =>
    res.type("xml").send(data.feed.render("atom-1.0"))))

app.get("/blog/rss.xml", withBlog((req, res, data) =>
    res.type("xml").send(data.feed.render("rss-2.0"))))

app.get("/blog/index.html", renderBlog)

app.get("/blog/*.html", withBlog((req, res, data) =>
    // Slice off the initial `/blog/` in req.path
    res.send(data.cache.get(req.path).rendered)))

app.get("*.html", (req, res) => res.render(
    req.path.replace(/\.html$/, ".pug").slice(1),
    pugLocals(req.path, false)
))

app.get("*.css", stylus.middleware({
    src: path.resolve(__dirname, "../src"),
    // This'll be cleared when doing a full compilation, anyways.
    dest: path.resolve(__dirname, "../dist"),
    force: true,
    compile(str, path) {
        return stylus(str)
            .set("filename", path)
            .set("include css", true)
            .use(autoprefixer())
    },
}))

const base = path.resolve(__dirname, "../src")

const read = root => (req, res, next) => {
    const file = path.resolve(root, req.path.slice(1))

    return fs.stat(file, (err, stat) => {
        if (err != null) return next(err)
        if (!stat.isFile()) return res.redirect(`${req.baseUrl}${req.path}/`)
        return pipeline(
            fs.createReadStream(file),
            res.type(path.basename(file)).status(200)
        )
    })
}

app.get("*.css", read(path.resolve(__dirname, "../dist")))
app.get("*.*", read(base))

// Wait until *after* everything is parsed before addressing the default route.
app.get("/blog/", renderBlog)

app.get("/", (req, res) =>
    res.render("index.pug", pugLocals("/index.html", false)))

app.get("*/", (req, res, next) => {
    const name = req.path.replace(/\/{2,}/g, "/").slice(0, -1)
    const file = path.resolve(base, name.slice(1))

    return fs.stat(file, (err, stat) => {
        if (err != null) return next(err)
        if (stat.isFile()) return next({code: "ENOENT"})

        return res.render(
            `${name.slice(1)}/index.pug`,
            pugLocals(`${name}/index.html`, false)
        )
    })
})

app.use("*", (req, res) => res.sendStatus(404))
app.use("*", (err, req, res, next) => {
    if (err != null && (err.code === "ENOENT" || err.view != null)) {
        return res.sendStatus(404)
    } else {
        return next(err)
    }
})

app.listen(8080, () =>
    console.log("Server ready at http://localhost:8080"))
