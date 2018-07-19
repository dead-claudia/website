"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const marked = require("marked")
const hljs = require("highlight.js")

const markedRenderer = new marked.Renderer()

// Super simple HTML attribute sanitizer
function sanitize(str) {
    return str.replace(/[&<"]/g, m => {
        if (m === "&") return "&amp;"
        if (m === "<") return "&lt;"
        return "&quot;"
    })
}

/**
 * Make Marked support specifying image size in pixels in this format:
 *
 * ![alt](href = x WIDTH "title")
 * ![alt](href = HEIGHT x "title")
 * ![alt](href = HEIGHT x WIDTH "title")
 *
 * Note: whitespace from the equals sign to the title/end of image is
 * all optional. Each of the above examples are equivalent to these
 * below, respectively:
 *
 * ![alt](href =xWIDTH "title")
 * ![alt](href =HEIGHTx "title")
 * ![alt](href =HEIGHTxWIDTH "title")
 *
 * Example usage:
 *
 * ![my image](https://example.com/my-image.png =400x600 "My image")
 */
markedRenderer.image = function (href, title, alt) {
    const exec = /\s=\s*(\d*%?)\s*x\s*(\d*%?)\s*$/.exec(href)

    if (exec) href = href.slice(0, -exec[0].length)
    let res = `<img src="${sanitize(href)}" alt="${sanitize(alt)}`

    if (title) res += `" title="${sanitize(title)}`
    if (exec && exec[1]) res += `" height="${exec[1]}`
    if (exec && exec[2]) res += `" width="${exec[2]}`
    return `${res}">`
}

module.exports = (file, contents) => marked(contents, {
    langPrefix: "hljs hljs-",
    renderer: markedRenderer,
    // The highlighter isn't loaded until later.
    highlight(code, lang) {
        try {
            return hljs.highlight(lang, code).value
        } catch (e) {
            e.message += ` (from file: ${file})`
            throw e
        }
    },
})
