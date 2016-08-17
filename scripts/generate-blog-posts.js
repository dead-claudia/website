"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

// This isn't the cleanest refactoring, but I don't know of any cleaner way to
// separate this from ./compile-blog-posts.js

// This does incorporate several elements from
// https://github.com/j201/meta-marked, but it doesn't actually *render* the
// markdown into HTML, as that's deferred to the browser.

const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const Feed = require("feed")

const compilePreview = require("./compile-markdown-preview.js")

const postDir = path.resolve(__dirname, "../src/blog.ignore")

const idsFile = path.resolve(postDir, "blog-ids.json")
const idsJson = require(idsFile)

function ensureKey(name) {
    name = path.relative(postDir, name)

    if (idsJson.ids.indexOf(name) >= 0) return
    idsJson.ids.push(name)
    fs.writeFileSync(idsFile, `${JSON.stringify(idsJson, null, 4)}\n`)
}

// Splits the given string into a meta section and a markdown section.
function splitInput(file, reject, resolve) {
    return fs.readFile(file, "utf-8", (err, str) => {
        if (err != null) return reject(err)
        if (str.slice(0, 3) === "---") {
            const matcher = /\n(\.\.\.|---)/g
            const metaEnd = matcher.exec(str)

            if (metaEnd != null) {
                const raw = str.slice(matcher.lastIndex)
                let meta

                try {
                    meta = yaml.safeLoad(str.slice(0, metaEnd.index), {
                        filename: file,
                    })
                } catch (e) {
                    return reject(e)
                }

                return resolve({file, meta, raw, preview: compilePreview(raw)})
            }
        }

        return reject(new Error(`${file}: Missing required metadata block!`))
    })
}

// Cache this, so the server isn't recompiling every file on every JSON read or
// post get. Only what's changed + the JSON file (which shouldn't be large).
const mtimes = {}
const cache = {}
const compiled = {}

// Important item of note: the `write` function is used for output, and may
// return a promise. This method is also used to keep the I/O more async.
//
// (This would be much easier to do correctly with an observable...)
module.exports = write => new Promise((resolve, reject) => {
    return fs.readdir(postDir, (err, files) => {
        if (err != null) return reject(err)
        if (files.length === 0) return resolve([])

        const feed = new Feed({
            title: "Isiah Meadows' blog",
            description: "My personal blog",
            id: "http://isiahmeadows.com/blog.html",
            link: "http://isiahmeadows.com/blog.html",
            copyright: "Some rights reserved 2013-present, Isiah Meadows.",
            author: {
                name: "Isiah Meadows",
                email: "me@isiahmeadows.com",
                link: "http://isiahmeadows.com/",
            },
        })

        feed.addCategory("technology")
        feed.addCategory("politics")
        feed.addCategory("opinions")
        feed.addCategory("javascript")

        const posts = []
        let counter = files.length

        function done(err) {
            if (!counter) return undefined

            if (err != null) {
                counter = 0
                return reject(err)
            }

            if (!--counter) {
                return resolve({posts, compiled, feed})
            }

            return undefined
        }

        function handleStat(file) {
            return (err, stat) => {
                if (err != null) return done(err)
                if (!stat.isFile()) return done()

                ensureKey(file)

                if (mtimes[file] >= stat.mtime) {
                    const post = cache[file]

                    posts.push(post)
                    feed.addItem({
                        title: post.title,
                        id: idsJson.ids.indexOf(file),
                        description: post.preview,
                        date: post.date,
                        published: post.date,
                        link: `http://isiahmeadows.com/blog.html#/posts/${post.url}`,
                    })

                    return done()
                }
                return splitInput(file, reject, split => {
                    const url = path.posix.relative(postDir, file)

                    mtimes[file] = stat.mtime

                    feed.addItem({
                        title: split.meta.title,
                        id: idsJson.ids.indexOf(file),
                        description: split.preview,
                        date: split.meta.date,
                        published: split.meta.date,
                        link: `http://isiahmeadows.com/blog.html#/posts/${url}`,
                    })

                    posts.push(cache[file] = {
                        date: split.meta.date,
                        title: split.meta.title,
                        preview: split.preview,
                        url,
                        tags: split.meta.tags || [],
                    })

                    cache[file].tags.forEach(tag => {
                        /^[\w ,\-]+$/.test(tag)
                    })

                    compiled[url] = split.raw

                    if (write) {
                        return Promise.resolve(write(file, split.raw, url))
                        .then(() => done(), done)
                    } else {
                        return done()
                    }
                })
            }
        }

        for (const file of files) {
            if (file !== "README.md" && file.slice(-3) === ".md") {
                const resolved = path.join(postDir, file)

                fs.stat(resolved, handleStat(resolved))
            } else {
                // If it's not a markdown file, skip it.
                done() // eslint-disable-line callback-return
            }
        }

        return undefined
    })
})
