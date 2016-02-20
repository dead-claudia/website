"use strict"

const p = require("./promise.js")

const path = require("path")
const join = path.join
const mkdirp = p.promisify(require("mkdirp"))
const spawn = require("child_process").spawn
const os = require("os")

const exec = require("./exec-limit.js")
const walk = require("./walk.js")

exec.limit = (os.cpus().length * 1.5 | 0) + 1

const rcache = Object.create(null)

function r(file) {
    if (file in rcache) return rcache[file]
    return rcache[file] = path.resolve(__dirname, file)
}

function runScript(verb, cmd, name) {
    return exec(cmd, () => console.log(`${verb} file: ${join("src", name)}`))
}

function minifyJs(src, dist, name) {
    return runScript("Minifying", ["uglifyjs", src, "-cmo", dist], name)
}

function makeCompiler(verb, script) {
    return (src, dist, name) =>
        runScript(verb, ["node", script, src, dist, name], name)
}

const compileStylus = makeCompiler("Compiling", r("compile-stylus.js"))
const compileJade = makeCompiler("Compiling", r("compile-jade.js"))
const copyFile = makeCompiler("Copying", r("copy.js"))

// The directory separator never appears in fs.readdir listings
function ignore(file) {
    return /^\.|^README\.md$|\.ignore(\.[^\.]+)?$/.test(file)
}

require("./run.js")({
    "clean": () => exec(["node", r("rm-dist.js")]),

    "compile:copy": () => walk(r("../dist-tmpl"))
    .then(srcs => Promise.all(srcs.map(src => {
        const name = path.relative(r("../dist-tmpl"), src)
        const dist = join(r("../dist"), name)

        return mkdirp(path.dirname(dist)).then(() => {
            return exec(["node", r("copy.js"), src, dist], () => {
                console.log(`Copying file: ${join("dist-tmpl", name)}`)
            })
        })
    }))),

    "compile:blog": () =>
        exec(["node", r("compile-blog-posts.js")], () => {
            console.log("Compiling blog posts...")
        }),

    "compile:rest": () => walk(r("../src"), ignore)
    .then(srcs => Promise.all(srcs.map(src => {
        // Don't create the parent directory for these files.
        if (/^license(\.[^\.]*)$/.test(src)) return Promise.resolve()
        if (/\.mixin\.[^\\\/\.]+$/.test(src)) return Promise.resolve()

        const name = path.relative(r("../src"), src)
        const dist = join(r("../dist"), name)

        return mkdirp(path.dirname(dist)).then(() => {
            if (/\.js$/.test(src)) return minifyJs(src, dist, name)
            if (/\.styl$/.test(src)) return compileStylus(src, dist, name)
            if (/\.jade$/.test(src)) return compileJade(src, dist, name)
            return copyFile(src, dist, name)
        })
    }))),

    "compile": t => t.clean().then(() => Promise.all([
        t["compile:copy"](),
        t["compile:blog"](),
        t["compile:rest"](),
    ])),

    "lint": () => new Promise((resolve, reject) => {
        // This will never run concurrently with anything else spawned in this
        // script.
        return spawn("eslint", ["."], {
            cwd: r(".."),
            stdio: "inherit",
        }).on("close", (code, signal) => {
            if (code == null || code) {
                if (signal) console.error(`Child killed with signal ${signal}`)

                /* eslint-disable no-process-exit */

                return process.exit(code || 1)

                /* eslint-enable no-process-exit */
            } else {
                return resolve()
            }
        }).on("error", reject)
    }),

    "deploy": () => exec(["node", r("deploy.js")]),

    "default": t => t.lint().then(() => t.compile()),
})
