"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const Feed = require("feed")

const WatchingGenerator = require("./_watching")
const compileMarkdown = require("../compile-markdown")
const {pcall, template} = require("../util")

const postDir = path.resolve(__dirname, "../../blog")

const fileIdsReady = (async () => {
    const idsFile = path.resolve(postDir, "blog-ids.yml")
    const idsList = yaml.safeLoad(
        await pcall(cb => fs.readFile(idsFile, "utf-8", cb)),
        {filename: idsFile}
    )
    const fileIdCache = new Map(
        Object.keys(idsList).map(id => [idsList[id], +id])
    )

    return {
        map: fileIdCache, file: idsFile,
        current: Math.max(...fileIdCache.values()) + 1,
    }
})()

module.exports = class BlogGenerator extends WatchingGenerator {
    constructor(opts = {}) {
        super({
            ...opts,
            glob: "**/*.md",
            template: "blog-post.pug",
            cwd: postDir,
            root: postDir,
            ignored: ["**/README.md", "**/_drafts/**"],
            on: {
                add: file => {
                    console.log(`Post added: ${file}`)
                    return this._compilePost(file)
                },

                change: file => {
                    console.log(`Post changed: ${file}`)
                    return this._compilePost(file)
                },

                unlink: file => {
                    console.log(`Post deleted: ${file}`)
                    this._map.delete(file)
                },
            },
        })

        this._feedItems = new Map()
        this._feed = undefined
        this._list = undefined
    }

    _renderOpts(post) {
        return {post}
    }

    async _compilePost(name) {
        const idCache = await fileIdsReady
        let id = idCache.map.get(name)

        if (id == null) {
            idCache.map.set(name, id = idCache.current++)
            await pcall(cb =>
                fs.appendFile(idCache.file, `${id}: ${name}\n`, cb)
            )
        }

        const url = `/blog/${name.replace(/\.md$/, ".html")}`
        const file = path.resolve(postDir, name)
        const markdown = await pcall(cb => fs.readFile(file, "utf-8", cb))

        if (markdown.slice(0, 3) === "---") {
            const matcher = /\n(\.\.\.|---)/g
            const metaEnd = matcher.exec(markdown)

            if (metaEnd != null) {
                const raw = markdown.slice(matcher.lastIndex)
                const meta = yaml.safeLoad(markdown.slice(0, metaEnd.index), {
                    filename: file,
                })

                // My timezone offset is -5 hours, and I need to display that
                // correctly. This calculates the correct relative offset in
                // milliseconds, which should be 0 if in EST (i.e. offset of
                // -5 hours).
                const offset = 60 * 1000 *
                    (new Date().getTimezoneOffset() - 5 * 60)

                const date = new Date(Date.parse(meta.date) + offset)
                const preview = compileMarkdown.preview(raw)
                const body = compileMarkdown.html(
                    path.posix.relative(postDir, file), raw
                )

                const post = {
                    date, preview, body, url,
                    title: meta.title,
                    tags: meta.tags || [],
                }

                this._renderCache.delete(url)
                this._map.set(url, post)
                this._feedItems.set(url, {
                    id, date, published: date,
                    title: meta.title,
                    description: preview,
                    link: `https://isiahmeadows.com${url}`,
                })
                return
            }
        }

        throw new Error(`${file}: Missing required metadata block!`)
    }

    async renderFeed(type) {
        if (this._feed != null) return this._feed.render(type)
        await this._ready
        if (this._feed != null) return this._feed.render(type)
        this._feed = new Feed({
            title: "Isiah Meadows' blog",
            description: "My personal blog",
            id: "https://isiahmeadows.com/blog/",
            link: "https://isiahmeadows.com/blog/",
            copyright: "Some rights reserved 2019-present, Isiah Meadows.",
            author: {
                name: "Isiah Meadows",
                email: "me@isiahmeadows.com",
                link: "https://isiahmeadows.com/",
            },
        })

        this._feed.addCategory("technology")
        this._feed.addCategory("opinions")
        this._feed.addCategory("javascript")

        for (const item of this._feedItems.values()) this._feed.addItem(item)
        return this._feed.render(type)
    }

    async renderPosts() {
        if (this._posts == null) {
            await this._ready
            if (this._posts == null) {
                // The posts should be sorted by reverse date.
                this._posts = [...this._map.values()]
                this._posts.sort((a, b) => b.date - a.date)
            }
        }

        return this._pug.generate(
            template("blog.pug"), "/blog/index.html",
            {posts: this._posts}
        )
    }
}
