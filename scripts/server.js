"use strict"

const fs = require("fs")
const path = require("path")
const express = require("express")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")

const pugLocals = require("./pug-locals.js")
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

const website = new express.Router({
    strict: app.get("strict routing"),
})

// /license.*, .mixin.{html,css}, .pug, .ignore.*
website.get(
    /^\/license[\/\.]|\.(mixin\.(html|css)|pug|ignore(\.[^\.]+))$/,
    (req, res, next) => next({code: "ENOENT"}))

website.get("*.html", (req, res) => {
    const file = req.path.slice(1)

    return res.render(file.replace(/\.html$/, ".pug"), pugLocals(file, false))
})

website.get("*.css", stylus.middleware({
    src: path.resolve(__dirname, "../src"),
    // This'll be cleared when doing a full compilation, anyways.
    dest: path.resolve(__dirname, "../dist"),
    force: true,
    compile(str, path) {
        return stylus(str)
        .set("filename", path)
        .use(autoprefixer())
    },
}))

function getBlog(route, render) {
    website.get(route, (req, res, next) =>
        generateBlog().then(data => render(req, res, data)).catch(next))
}

getBlog("/blog.atom.xml", (req, res, data) =>
    res.type("xml").send(data.feed.render("atom-1.0")))

getBlog("/blog.rss.xml", (req, res, data) =>
    res.type("xml").send(data.feed.render("rss-2.0")))

getBlog("/blog.json", (req, res, data) => res.send({posts: data.posts}))

getBlog("/blog/*.md", (req, res, data) =>
    // Slice off the initial `/blog/` in req.path
    res.send(data.compiled[req.path.slice(6)]))

const base = path.resolve(__dirname, "../src")

const read = root => (req, res, next) => {
    const file = path.resolve(root, req.path.slice(1))

    return fs.stat(file, (err, stat) => {
        if (err != null) return next(err)
        if (!stat.isFile()) return res.redirect(`${req.baseUrl}${req.path}/`)
        return fs.createReadStream(file)
        .on("error", next)
        .pipe(res.type(path.basename(file)).status(200))
    })
}

website.get("*.css", read(path.resolve(__dirname, "../dist")))
website.get("*.*", read(base))

website.get("/", (req, res) =>
    res.render("index.pug", pugLocals("index.html", false)))

website.get("*", (req, res, next) => {
    const file = path.resolve(base, req.path.slice(1))

    return fs.stat(file, (err, stat) => {
        if (err != null) return next(err)
        if (stat.isFile()) return next({code: "ENOENT"})
        const file = `${req.baseUrl}${req.path}/index`

        return res.render(`${file}.jade`, pugLocals(`${file}.html`, false))
    })
})

app.use("/website", website)

app.use("*", (req, res) => res.sendStatus(404))

app.listen(8080, () =>
    console.log("Server ready at http://localhost:8080/website"))
