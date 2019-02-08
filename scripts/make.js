"use strict"

const fs = require("fs")
const path = require("path")
const {promisify} = require("util")
const mkdirp = promisify(require("mkdirp"))
const rimraf = promisify(require("rimraf"))

const util = require("./util")

util.setProcessLimit(cpus => cpus * 1.5 + 1)

const r = file => path.resolve(__dirname, file)

async function prepare(file, src, target) {
    const base = path.relative(src, file)
    const dist = path.join(target, base)
    const name = path.join(path.relative(r(".."), src), base)

    await mkdirp(path.dirname(dist))
    return {src: file, name, dist}
}

const prepareSrc = file => prepare(file, r("../src"), r("../dist"))
const prepareTmpl = file => prepare(file, r("../dist-tmpl"), r("../dist"))

async function copyFile(file) {
    console.log(`Copying file: ${file.name}`)
    await util.pcall(cb => fs.copyFile(file.src, file.dist, cb))
}

function run(label, name, args = [], opts = {}) {
    return util.exec(name, args, {onopen() { console.log(label) }, ...opts})
}

function task(label, name, args = []) {
    return run(label, "node", [r(`tasks/${name}.js`), ...args])
}

async function minifyJs(file) {
    const {src, name, dist} = await prepareSrc(file)

    await run(`Minifying file: ${name}`, "uglifyjs", [src, "-cmo", dist])
}

async function compileStylus(file) {
    const {src, name, dist} = await prepareSrc(file)

    await task(`Compiling file: ${name}`, "compile-stylus", [src, dist, name])
}

async function compilePug(file) {
    const {src, name, dist} = await prepareSrc(file)

    await task(`Compiling file: ${name}`, "compile-pug", [src, dist, name])
}

require("./run.js")({
    "clean": () => rimraf("dist/**"),

    "compile:copy": () => util.walk(r("../dist-tmpl/**"), async file => {
        await copyFile(await prepareTmpl(file))
    }),

    "compile:blog": () => task("Compiling blog posts...", "compile-blog-posts"),
    "compile:songs": () => task("Compiling songs...", "compile-songs"),

    "compile:rest": () => util.walk(r("../src/**"), {
        // Don't iterate any of these files.
        ignore: [
            "**/README.md", "**/*.ignore/**", "**/*.ignore.*",
            "**/license.*", "**/mixins/**", "**/templates/**",
        ],
    }, async file => {
        switch (path.extname(file)) {
        case ".js": await minifyJs(file); break
        case ".styl": await compileStylus(file); break
        case ".pug": await compilePug(file); break
        default: await copyFile(await prepareSrc(file))
        }
    }),

    "compile": async t => {
        await t("clean")
        await Promise.all([
            t("compile:copy"),
            t("compile:blog"),
            t("compile:songs"),
            t("compile:rest"),
        ])
    },

    "lint:check-whitespace": () =>
        task("Linting whitespace in non-JS files...", "check-whitespace"),

    "lint:eslint": () =>
        run("Linting JS...", "eslint", ["."], {cwd: r("..")}),

    "lint": async t => {
        await t("lint:eslint")
        await t("lint:check-whitespace")
    },

    "deploy": () => task("Deploying...", "deploy"),

    "default": async t => {
        await t("lint")
        await t("compile")
    },
})
