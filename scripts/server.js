"use strict"

const fs = require("fs")
const path = require("path")
const express = require("express")
const app = express()

const JadeLocals = require("./jade-locals.js")
const generateBlog = require("./generate-blog-posts.js")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")

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

function fail(req, res, next) {
    return next(missing)
}

// .mixin.{html,css}, .jade, .ignore, .ignore.*
website.get(/\.(mixin\.(html|css)|jade|ignore(\.[^\.]+))$/, fail)

website.get("*.html", (req, res) => {
    const FILE = req.path.slice(1)
    const file = FILE.replace(/\.html$/, ".jade")
    return res.render(file, new JadeLocals(FILE, false))
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

function get(root, methods) {
    return (req, res, next) => {
        const file = path.resolve(root, req.path.slice(1))
        if (!methods.pre({file, req, res, next})) return
        return fs.stat(file, (err, stat) => {
            if (err != null) return next(err)
            if (stat.isDirectory()) {
                return methods.dir({file, req, res, next})
            } else {
                return methods.file({file, req, res, next})
            }
        })
    }
}

website.get("*.css", get(path.resolve(__dirname, "../dist"), {
    pre: o => (o.res.type(path.basename(o.file)), true),
    dir: o => o.res.redirect(`${o.req.baseUrl}${o.req.path}/`),
    file: o =>
        fs.createReadStream(o.file)
        .on("error", o.next)
        .pipe(o.res.status(200)),
}))

website.get("*.*", get(base, {
    pre: o => (o.res.type(path.basename(o.file)), true),
    dir: o => o.res.redirect(`${o.req.baseUrl}${o.req.path}/`),
    file: o =>
        fs.createReadStream(o.file)
        .on("error", o.next)
        .pipe(o.res.status(200)),
}))

website.get("*", get(base, {
    pre: o => o.res.redirect(`${o.req.baseUrl}/index.html`),
    dir: o => o.res.redirect(`${o.req.baseUrl}${o.req.path}/index.html`),
    file: o => o.next(missing),
}))

app.use("/website", website)

app.use("*", (err, req, res, next) => {
    if (err.code === "ENOENT") return res.sendStatus(404)
    return next(err)
})

app.listen(8080, () => console.log("Server ready at http://localhost:8080"))
