"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const {promises: fs} = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const Feed = require("feed")

const compileMarkdown = require("../compile-markdown")
const generatePug = require("./pug")
const util = require("../util")

const postDir = path.resolve(__dirname, "../../blog")
const postTemplate = path.resolve(
    __dirname, "../../src/templates/blog-post.pug"
)

const idsFile = path.resolve(postDir, "blog-ids.yml")
const idsList = yaml.safeLoad(require("fs").readFileSync(idsFile, "utf-8"), {
    filename: idsFile,
})
const fileIdCache = new Map(Object.keys(idsList).map(id => [idsList[id], +id]))
let nextId = Math.max(fileIdCache.values()) + 1

// Splits the given string into a meta section and a markdown section.
async function splitInput(name) {
    const file = path.resolve(postDir, name)
    const markdown = await fs.readFile(file, "utf-8")

    if (markdown.slice(0, 3) === "---") {
        const matcher = /\n(\.\.\.|---)/g
        const metaEnd = matcher.exec(markdown)

        if (metaEnd != null) {
            const raw = markdown.slice(matcher.lastIndex)
            const meta = yaml.safeLoad(markdown.slice(0, metaEnd.index), {
                filename: file,
            })

            // My timezone offset is -5 hours, and I need to display
            // that correctly. This calculates the correct relative
            // offset in milliseconds, which should be 0 if in EST (i.e.
            // offset of -5 hours).
            const offset = 60 * 1000 *
                (new Date().getTimezoneOffset() - 5 * 60)

            meta.date = new Date(Date.parse(meta.date) + offset)

            return {
                file, meta,
                preview: compileMarkdown.preview(raw),
                raw: compileMarkdown.html(
                    path.posix.relative(postDir, file), raw
                ),
            }
        }
    }

    throw new Error(`${file}: Missing required metadata block!`)
}

// Cache this, so the server isn't recompiling every file on every request. Only
// what's changed.
const cache = new Map()

// Important item of note: the `write` function is used for output, and may
// return a promise. This method is also used to keep the I/O more async.
//
// (This would be much easier to do correctly with an observable...)
module.exports = async (minified, write) => {
    const feed = new Feed({
        title: "Isiah Meadows' blog",
        description: "My personal blog",
        id: "https://isiahmeadows.com/blog/",
        link: "https://isiahmeadows.com/blog/",
        copyright: "Some rights reserved 2013-present, Isiah Meadows.",
        author: {
            name: "Isiah Meadows",
            email: "me@isiahmeadows.com",
            link: "https://isiahmeadows.com/",
        },
    })

    feed.addCategory("technology")
    feed.addCategory("politics")
    feed.addCategory("opinions")
    feed.addCategory("javascript")

    const posts = []

    await util.walk("**/*.md", {
        cwd: postDir,
        root: postDir,
        ignore: ["**/README.md", "**/_drafts/**"],
        stat: true,
    }, async (name, stat) => {
        const url = `/blog/${name.replace(/\.md$/, ".html")}`

        if (!fileIdCache.has(name)) {
            fileIdCache.set(name, nextId)
            await fs.appendFile(idsFile, `${nextId++}: ${name}\n`)
        }

        let entry = cache.get(url)

        if (entry == null) {
            entry = {
                mtime: 0,
                post: undefined,
                compiled: undefined,
                rendered: undefined,
            }
            cache.set(url, entry)
        }

        let post

        if (entry.mtime !== 0 && entry.mtime <= stat.mtime) {
            post = entry.post
        } else {
            const {raw, meta, preview} = await splitInput(name)

            post = {
                date: meta.date,
                title: meta.title,
                preview, raw, url,
                tags: meta.tags || [],
            }

            const html = generatePug(postTemplate, url, minified, {post})

            entry.post = post
            entry.compiled = raw
            entry.rendered = html
            entry.mtime = stat.mtime
            if (write) await write(post, html)
        }

        posts.push(post)
        feed.addItem({
            title: post.title,
            id: fileIdCache.get(name),
            description: post.preview,
            date: post.date,
            published: post.date,
            link: `https://isiahmeadows.com${url}`,
        })
    })

    // The posts should be sorted by reverse date.
    posts.sort((a, b) => b.date - a.date)
    return {posts, cache, feed}
}
