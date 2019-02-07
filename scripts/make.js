"use strict"

const {promises: fs} = require("fs")
const path = require("path")
const util = require("util")
const mkdirp = util.promisify(require("mkdirp"))
const rimraf = util.promisify(require("rimraf"))

const {exec, walk, setProcessLimit} = require("./util")

setProcessLimit(cpus => cpus * 1.5 + 1)

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
    await fs.copyFile(file.src, file.dist)
}

async function minifyJs(file) {
    const {src, name, dist} = await prepareSrc(file)

    await exec("uglifyjs",
        [src, "-cmo", dist],
        {onopen() { console.log(`Minifying file: ${name}`) }}
    )
}

async function compileStylus(file) {
    const {src, name, dist} = await prepareSrc(file)

    await exec("node",
        [r("tasks/compile-stylus.js"), src, dist, name],
        {onopen() { console.log(`Compiling file: ${name}`) }}
    )
}

async function compilePug(file) {
    const {src, name, dist} = await prepareSrc(file)

    await exec("node",
        [r("tasks/compile-pug.js"), src, dist, name],
        {onopen() { console.log(`Compiling file: ${name}`) }}
    )
}

require("./run.js")({
    "clean": () => rimraf("dist/**"),

    "compile:copy": () => walk(r("../dist-tmpl/**"), async file => {
        await copyFile(await prepareTmpl(file))
    }),

    "compile:blog": () => exec("node", [
        r("tasks/compile-blog-posts.js"),
    ], () => {
        console.log("Compiling blog posts...")
    }),

    "compile:songs": () => exec("node", [
        r("tasks/compile-songs.js"),
    ], () => {
        console.log("Compiling songs...")
    }),

    "compile:rest": () => walk(r("../src/**"), {
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

    "lint:check-whitespace": async () => {
        await exec("node", [r("check-whitespace.js")])
    },

    "lint:eslint": async () => {
        await exec("eslint", ["."], {cwd: r("..")})
    },

    "deploy": async () => {
        await exec("node", [r("deploy.js")])
    },

    "lint": async t => {
        await t("lint:eslint")
        await t("lint:check-whitespace")
    },

    "default": async t => {
        await t("lint")
        await t("compile")
    },
})
