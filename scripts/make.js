"use strict"

const {promises: fs} = require("fs")
const path = require("path")
const os = require("os")
const util = require("util")
const mkdirp = util.promisify(require("mkdirp"))

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

require("./run.js")({
    "clean": () => exec(["node", r("rm-dist.js")]),

    "compile:copy": () => walk(r("../dist-tmpl/**"), async src => {
        const name = path.relative(r("../dist-tmpl"), src)
        const dist = path.join(r("../dist"), name)

        await mkdirp(path.dirname(dist))
        console.log(`Copying file: ${path.join("dist-tmpl", name)}`)
        await fs.copyFile(src, dist)
    }),

    "compile:blog": () => exec(["node", r("compile-blog-posts.js")], () => {
        console.log("Compiling blog posts...")
    }),

    "compile:rest": () => walk(r("../src/**"), {
        // Don't iterate any of these files.
        ignore: [
            "**/README.md", "**/*.ignore/**", "**/*.ignore.*",
            "**/license.*", "**/mixins/**",
        ],
    }, async src => {
        const name = path.relative(r("../src"), src)
        const dist = path.join(r("../dist"), name)

        await mkdirp(path.dirname(dist))

        switch (path.extname(src)) {
        case ".js": await minifyJs(src, dist, name); break
        case ".styl": await compileStylus(src, dist, name); break
        case ".pug": await compilePug(src, dist, name); break
        default:
            console.log(`Copying file: ${path.join("src", name)}`)
            await fs.copyFile(src, dist)
        }
    }),

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
