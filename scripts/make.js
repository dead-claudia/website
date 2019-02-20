"use strict"

const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const rimraf = require("rimraf")

const {pcall, walk, exec, setProcessLimit} = require("./util")

setProcessLimit(cpus => cpus * 1.5 + 1)

const r = file => path.resolve(__dirname, file)

async function prepareSrc(file) {
    const base = path.relative(r("../src/public"), file)
    const dist = path.join(r("../dist"), base)
    const name = path.join("src/public", base)

    await pcall(cb => mkdirp(path.dirname(dist), cb))
    return {src: file, name, dist}
}

function copyFile({src, name, dist}) {
    console.log(`Copying file: ${name}`)
    return pcall(cb => fs.copyFile(src, dist, cb))
}

function run(label, name, args = [], opts = {}) {
    return exec(name, args, {onopen() { console.log(label) }, ...opts})
}

function task(name, ...args) {
    return exec("node", [r(`tasks/${name}.js`), ...args])
}

require("./run")({
    async "clean"() {
        await pcall(cb => rimraf("dist/**", cb))
    },

    async "compile:copy"() {
        await walk(r("../src/public/{.nojekyll,**}"), {
            ignore: [
                // Ignore preprocessed files
                "**/*.pug", "**/*.styl", "**/*.js",
                // Ignore OS junk
                ".DS_Store",
            ],
        }, async file => {
            await copyFile(await prepareSrc(file))
        })
    },

    async "compile:blog"() {
        await task("compile", "blog-posts")
    },

    async "compile:songs"() {
        await task("compile", "songs")
    },

    async "compile:js"() {
        await walk(r("../src/public/**/*.js"), async file => {
            const {src, name, dist} = await prepareSrc(file)

            await run(
                `Minifying file: ${name}`, "uglifyjs", [src, "-cmo", dist]
            )
        })
    },

    async "compile:pug"() {
        await walk(r("../src/public/**/*.pug"), async file => {
            const {src, name, dist} = await prepareSrc(file)

            await task("compile-pug", src, dist, name)
        })
    },

    async "compile:stylus"() {
        await task("compile", "stylus")
    },

    async "compile"(t) {
        await t("clean")
        await Promise.all([
            t("compile:copy"),
            t("compile:stylus"),
            t("compile:blog"),
            t("compile:songs"),
            t("compile:pug"),
        ])
    },

    async "lint:check-whitespace"() {
        await task("check-whitespace")
    },

    async "lint:eslint"() {
        await run("Linting JS...", "eslint", ["."], {cwd: r("..")})
    },

    async "lint"(t) {
        await t("lint:eslint")
        await t("lint:check-whitespace")
    },

    async "deploy"() {
        await exec(r("tasks/deploy.sh"), [], {cwd: r("..")})
    },

    async "default"(t) {
        await t("lint")
        await t("compile")
    },
})
