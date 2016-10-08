"use strict"

const path = require("path")
const os = require("os")
const mkdirp = require("mkdirp")

const pcall = require("./promise.js")
const exec = require("./exec-limit.js")
const walk = require("./walk.js")

exec.limit = (os.cpus().length * 1.5 | 0) + 1

const r = file => path.resolve(__dirname, file)

const runScript = (verb, cmd, name) =>
    exec(cmd, () => console.log(`${verb} file: ${path.join("src", name)}`))

const minifyJs = (src, dist, name) =>
    runScript("Minifying", ["uglifyjs", src, "-cmo", dist], name)

const makeCompiler = (verb, script) => (src, dist, name) =>
    runScript(verb, ["node", script, src, dist, name], name)

const compileStylus = makeCompiler("Compiling", r("compile-stylus.js"))
const compilePug = makeCompiler("Compiling", r("compile-pug.js"))
const copyFile = makeCompiler("Copying", r("copy.js"))

// The directory separator never appears in fs.readdir listings
const ignore = file => /^\.|^README\.md$|\.ignore(\.[^\.]+)?$/.test(file)

require("./run.js")({
    "clean": () => exec(["node", r("rm-dist.js")]),

    "compile:copy": () => walk(r("../dist-tmpl"))
    .then(srcs => Promise.all(srcs.map(src => {
        const name = path.relative(r("../dist-tmpl"), src)
        const dist = path.join(r("../dist"), name)

        return pcall(mkdirp, path.dirname(dist)).then(() => {
            return exec(["node", r("copy.js"), src, dist], () => {
                console.log(`Copying file: ${path.join("dist-tmpl", name)}`)
            })
        })
    }))),

    "compile:blog": () => exec(["node", r("compile-blog-posts.js")], () => {
        console.log("Compiling blog posts...")
    }),

    "compile:rest": () => walk(r("../src"), ignore)
    .then(srcs => Promise.all(srcs.map(src => {
        // Don't create the parent directory for these files.
        if (/^license(\.[^\.]*)$/.test(src)) return Promise.resolve()
        if (/\.mixin\.[^\\\/\.]+$/.test(src)) return Promise.resolve()

        const name = path.relative(r("../src"), src)
        const dist = path.join(r("../dist"), name)

        return pcall(mkdirp, path.dirname(dist)).then(() => {
            if (/\.js$/.test(src)) return minifyJs(src, dist, name)
            if (/\.styl$/.test(src)) return compileStylus(src, dist, name)
            if (/\.pug$/.test(src)) return compilePug(src, dist, name)
            return copyFile(src, dist, name)
        })
    }))),

    "compile": t => t.clean().then(() => Promise.all([
        t["compile:copy"](),
        t["compile:blog"](),
        t["compile:rest"](),
    ])),

    "lint:check-whitespace": () => exec(["node", r("check-whitespace.js")]),
    "lint:eslint": () => exec("eslint .", undefined, {cwd: r("..")}),

    "deploy": () => exec(["node", r("deploy.js")]),

    "lint": t => t["lint:eslint"]().then(t["lint:check-whitespace"]),
    "default": t => t.lint().then(t.compile),
})
