"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const {pipeline} = require("stream")
const {pcall} = require("../util")

const PugGenerator = require("./generators/pug")
const BlogGenerator = require("./generators/blog-posts")
const SongGenerator = require("./generators/songs")
const StylusGenerator = require("./generators/stylus")

const pug = new PugGenerator({minified: false, watching: true})
const blog = new BlogGenerator({minified: false, watching: true})
const songs = new SongGenerator({minified: false, watching: true})
const styl = new StylusGenerator({minified: false, watching: true})

const base = path.resolve(__dirname, "../src")

module.exports = async (res, action) => {
    if (action.type === "song") return songs.renderURL(action.url)
    if (action.type === "post") return blog.renderURL(action.url)
    if (action.type === "stylus") return styl.renderURL(action.url)
    if (action.type === "feed") return blog.renderFeed(action.type)
    if (action.type === "blog") return blog.renderPosts()
    if (action.type === "page") {
        return pug.generate(
            path.resolve(base, action.url.replace(/\.html$/, ".pug")),
            action.url
        )
    }
    if (action.type === "static") {
        const file = path.resolve(base, action.url)
        const stat = await pcall(cb => fs.stat(file, cb))

        if (!stat.isFile()) return [302, `${action.url}/`]
        return pcall(cb => pipeline(fs.createReadStream(file), res, cb))
    }
    throw new Error(`Unexpected action: ${JSON.stringify(action)}`)
}
