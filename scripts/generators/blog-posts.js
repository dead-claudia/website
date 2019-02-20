"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const Feed = require("feed")

const WatchingPugGenerator = require("./_watching-pug")
const compileMarkdown = require("../compile-markdown")
const {pcall, template} = require("../util")

const postDir = path.resolve(__dirname, "../../blog")

const idsFile = path.resolve(postDir, "blog-ids.yml")
const fileIdCache = (async () => {
    const contents = await pcall(cb => fs.readFile(idsFile, "utf-8", cb))
    const data = yaml.safeLoad(contents, {filename: idsFile})
    const map = new Map(Object.entries(data).map(([id, name]) => [name, +id]))

    return {map, current: Math.max(...map.values()) + 1}
})()

async function getPostId(name) {
    const cache = await fileIdCache
    const id = cache.map.get(name)

    if (id != null) return id
    const next = cache.current++

    cache.map.set(name, next)
    await pcall(cb => fs.appendFile(idsFile, `${next}: ${name}\n`, cb))
    return next
}

module.exports = class BlogGenerator extends WatchingPugGenerator {
    constructor(opts = {}) {
        super({
            ...opts,
            glob: "**/*.md",
            template: "blog-post.pug",
            cwd: postDir,
            root: postDir,
            ignored: ["**/README.md", "**/_drafts/**"],
            addReceived: true,
        })

        this._feedItems = new Map()
        this._feed = undefined
        this._posts = undefined
    }

    _resolve(name) {
        return `/blog/${name.replace(/\.md$/, ".html")}`
    }

    _renderOpts(post) {
        return {post}
    }

    async _receive(type, url, file) {
        if (type === "add") {
            this.log(`Post added: ${file}`)
        } else if (type === "change") {
            this.log(`Post changed: ${file}`)
        } else {
            this.log(`Post deleted: ${file}`)
            this._feedItems.delete(url)
            return undefined
        }

        const source = path.resolve(postDir, file)
        const markdown = await pcall(cb => fs.readFile(source, "utf-8", cb))

        if (markdown.startsWith("---")) {
            let metaEnd = markdown.indexOf("\n---", 3)

            if (metaEnd < 0) metaEnd = markdown.indexOf("\n---", 3)
            if (metaEnd >= 0) {
                const source = markdown.slice(metaEnd + 4)
                const meta = yaml.safeLoad(markdown.slice(0, metaEnd), {
                    filename: source,
                })

                // My timezone offset is -5 hours, and I need to display that
                // correctly. This calculates the correct relative offset in
                // milliseconds, which should be 0 if in EST (i.e. offset of
                // -5 hours).
                const offset = 60 * 1000 *
                    (new Date().getTimezoneOffset() - 5 * 60)

                const date = new Date(Date.parse(meta.date) + offset)
                const preview = compileMarkdown.preview(source)
                const body = compileMarkdown.html(
                    path.posix.relative(postDir, source), source
                )

                this._feedItems.set(url, {
                    id: await getPostId(file),
                    date, published: date,
                    title: meta.title,
                    description: preview,
                    link: `https://isiahmeadows.com${url}`,
                })

                return {
                    date, preview, body, url,
                    title: meta.title,
                    tags: meta.tags || [],
                }
            }
        }

        throw new Error(`${source}: Missing required metadata block!`)
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
                this._posts = await Promise.all(this._map.values())
                this._posts.sort((a, b) => b.date - a.date)
            }
        }

        return this._pug.generate(
            template("blog.pug"), "/blog/index.html",
            {posts: this._posts}
        )
    }
}
