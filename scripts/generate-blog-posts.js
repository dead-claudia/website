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

const compilePreview = require("./compile-markdown-preview.js")

const postDir = path.resolve(__dirname, "../src/blog.ignore")

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
        const posts = []
        let counter = files.length

        function done(err) {
            if (!counter) return
            if (err != null) {
                counter = 0
                return reject(err)
            }
            if (!--counter) return resolve({posts, compiled})
        }

        function handleStat(file) {
            return (err, stat) => {
                if (err != null) return done(err)
                if (!stat.isFile()) return done()
                if (mtimes[file] >= stat.mtime) {
                    posts.push(cache[file])
                    return done()
                }
                return splitInput(file, reject, split => {
                    const url = path.posix.relative(postDir, file)
                    mtimes[file] = stat.mtime
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
                done()
            }
        }
    })
})
