"use strict"

const fs = require("fs")
const path = require("path")
const express = require("express")
const app = express()

const JadeLocals = require("./jade-locals.js")
const generateBlog = require("./generate-blog-posts.js")

function nocache(res) {
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Cache-Control", [
        "no-cache", "private", "no-store", "must-revalidate", "max-stale=0",
        "post-check=0", "pre-check=0",
    ].join())
    res.setHeader("Expires", 0)
}

app.set("views", "src")
app.set("view engine", "jade")
app.set("strict routing", true)
app.use((req, res, next) => {
    nocache(res)
    next()
})

app.use(require("morgan")("common"))

app.use((req, res, next) => {
    if (path.posix.join("/", req.path) !== req.path) return res.sendStatus(403)
    return next()
})

const website = new express.Router()

const missing = {code: "ENOENT"}
const fail = (req, res, next) => next(missing)

// .mixin.{html,css}, .jade, .ignore, .ignore.*
website.get(/\.(mixin\.(html|css)|jade|ignore(\.[^\.]+))$/, fail)

website.get("*.html", (req, res) => {
    const FILE = req.path.slice(1)
    const file = FILE.replace(/\.html$/, ".jade")
    return res.render(file, new JadeLocals(FILE, false))
})

website.get("*.css", require("postcss-middleware")({
    src: req => path.resolve(__dirname, "../src", req.path.slice(1)),
    plugins: [
        require("postcss-import")({path: path.resolve(__dirname, "../src")}),
        require("autoprefixer")({browsers: "last 2 versions, > 5%"}),
        require("postcss-reporter")({clearMessages: true, throwError: true}),
    ],
    inlineSourcemaps: true,
}))

website.get("/blog.json", (req, res, next) => generateBlog().then(data => {
    return res.send({posts: data.posts})
}).catch(next))

website.get("/blog/*.md", (req, res, next) => {
    return generateBlog().then(data => {
        // Slice off the `/blog/` in req.path
        return res.send(data.compiled[req.path.slice(6)])
    }).catch(next)
})

const base = path.resolve(__dirname, "../src")

function get(methods) {
    return (req, res, next) => {
        const file = path.resolve(base, req.path.slice(1))
        const maybe = methods.pre(file, req, res, next)
        if (maybe !== undefined) return maybe
        return fs.stat(file, (err, stat) => {
            if (err != null) return next(err)
            if (stat.isDirectory()) {
                return methods.dir(file, req, res, next)
            } else {
                return methods.file(file, req, res, next)
            }
        })
    }
}

website.get("*.*", get({
    pre(file, req, res) { res.type(path.basename(file)) },
    dir(file, req, res) { return res.redirect(`${req.baseUrl}${req.path}/`) },
    file(file, req, res, next) {
        return fs.createReadStream(file)
        .on("error", next)
        .pipe(res.status(200))
    },
}))

website.get("*", get({
    pre(file, req, res) { return res.redirect(`${req.baseUrl}/index.html`) },
    dir(file, req, res) {
        return res.redirect(`${req.baseUrl}${req.path}/index.html`)
    },
    file(file, req, res, next) { return next(missing) },
}))

app.use("/website", website)

app.use("*", (err, req, res, next) => {
    if (err.code === "ENOENT") return res.sendStatus(404)
    return next(err)
})

app.listen(8080, () => console.log("Server ready at http://localhost:8080"))
