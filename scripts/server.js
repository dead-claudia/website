"use strict"

const path = require("path")
const express = require("express")
const app = express()

const JadeLocals = require("./jade-locals.js")

function nocache(res) {
    res.setHeader("Cache-Control", [
        "no-cache", "private", "no-store", "must-revalidate", "max-stale=0",
        "post-check=0", "pre-check=0",
    ].join())
}

app.set("views", "src")
app.set("view engine", "jade")
app.use((req, res, next) => {
    nocache(res)
    next()
})
app.use(require("morgan")("common"))

app.use((req, res, next) => {
    if (path.posix.join("/", req.path) !== req.path) return res.sendStatus(403)
    return next()
})

const fail = (req, res) => res.sendStatus(404)

// .mixin.{jade,css}, .jade, .ignore, .ignore.*
app.get(/\.(mixin\.(jade|css)|jade|ignore(\.[^\.]+))$/, fail)

app.get("*.html", (req, res) => {
    const FILE = req.path.slice(1)
    const file = FILE.replace(/\.html$/, ".jade")
    return res.render(file, new JadeLocals(FILE, false))
})

app.get("*.css", require("postcss-middleware")({
    src: req => path.resolve(__dirname, "../src", req.path.slice(1)),
    plugins: [
        require("postcss-import")({
            path: path.resolve(__dirname, "../src"),
        }),
        require("autoprefixer"),
        require("postcss-reporter")({
            clearMessages: true,
            throwError: true,
        }),
    ],
    inlineSourcemaps: true,
}))

app.get("/blog.js", require("browserify-middleware")(
    path.resolve(__dirname, "../src/blog.ignore/index.js")
))

// TODO: implement this correctly.
app.get("/blog/*", (req, res) => res.sendStatus(404))

app.get("*.*", express.static(path.resolve(__dirname, "../src"), {
    index: false,
    redirect: false,
    setHeaders: nocache,
}))

app.get("*", (req, res) => {
    if (req.path !== "/") return fail(req, res)
    return res.render("index.jade", new JadeLocals("index.html", false))
})

app.listen(8080, () => console.log("Server ready at http://localhost:8080"))
