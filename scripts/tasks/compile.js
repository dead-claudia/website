#!/usr/bin/env node
"use strict"

// Pulled out for parallelism. This can only realistically be single-threaded.
// This does *not* attempt to compile in parallel, although I *could* modify the
// generators to work with that. (I'd rather wait for `invoke-parallel` to
// mature first.)

const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const {pcall} = require("../util")

const name = process.argv[2]
const dist = path.resolve(__dirname, "../../dist")

function write(target, contents) {
    return pcall(cb => fs.writeFile(target, contents, "utf-8", cb))
}

async function main() {
    // eslint-disable-next-line global-require
    const Generator = require(`../generators/${name}`)
    const inst = new Generator({minified: true, watching: false})

    if (name === "blog-posts") {
        const root = path.resolve(dist, "blog")

        const emit = async (name, render) => {
            console.log(`Writing file: /blog/${name}`)
            await write(path.join(root, name), await render())
        }

        await pcall(cb => mkdirp(root, cb))
        await emit("index.html", () => inst.renderPosts())
        await emit("atom.xml", () => inst.renderFeed("atom-1.0"))
        await emit("rss.xml", () => inst.renderFeed("rss-2.0"))
    }

    await inst.each(async (url, contents) => {
        console.log(`Writing file: ${url}`)
        url = path.resolve(dist, url.slice(1))
        await pcall(cb => mkdirp(path.dirname(url), cb))
        await write(url, contents)
    })
}

main()
    .catch(e => { console.error(e); return 1 })
    .then(process.exit)
