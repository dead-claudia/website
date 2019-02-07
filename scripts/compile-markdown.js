"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const marked = require("marked")
const hljs = require("highlight.js")
const sanitizeHtml = require("sanitize-html")

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

exports.html = (file, contents) => marked(contents, {
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

// I know this is quite arbitrary
const PREVIEW_LENGTH = 175

function cap(str) {
    str = str.replace(/\s+/, " ")

    const part = str.substr(0, PREVIEW_LENGTH)

    if (/^\S/.test(str.substr(PREVIEW_LENGTH))) {
        return part.replace(/\s+\S*$/, "")
    } else {
        return part
    }
}

// The inline lexer doesn't need any links. Also, the `output` method is pure.
const inlineLexer = new marked.InlineLexer([], {
    // Keep this formatted
    codespan: code => `\`${code}\``,

    // Just print the text here
    strong: text => text,
    em: text => text,
    del: text => text,
    link: (href, title, text) => text,

    // Omit these
    br: () => "",
    image: () => "",
})

exports.preview = src => {
    const tokens = marked.lexer(src)
    let index = 0
    let str = ""
    let end = false

    const peek = () => tokens[index + 1]
    const next = () => tokens[++index]
    const hasNext = () => !end && index < tokens.length
    const waitingFor = tok => hasNext() && next().type !== tok

    function loopAny(cond, body) {
        for (let i = 0; cond();) if (body(i++)) return true
        return false
    }

    function push(part) {
        // Safety check.
        if (end) return true

        // Prevent more than single spaces from getting in in the first place.
        // This won't be a perf problem, since the length limit is relatively
        // low, in which the compilation will abort anyways.
        if (part === " ") return false

        part = part.replace(/\s+/g, " ").trim()
        if (part === "") return false

        str += part

        if (str.length > PREVIEW_LENGTH) {
            // Break compilation.
            end = true
            str = cap(str)
            return true
        }

        str += " "
        return false
    }

    function textItem(src) {
        return push(sanitizeHtml(inlineLexer.output(src), {
            allowedTags: [],
            allowedAttributes: [],
        }))
    }

    function text(token) {
        let body = token.text

        while (hasNext() && peek().type === "text") {
            // eslint-disable-next-line callback-return
            body += ` ${next().text}`
        }

        return textItem(body)
    }

    const codeBlock = token =>
        push(`\`\`\`${token.lang}`) &&
        push(token.code.trim()) &&
        push("```")

    const simpleList = (prefix, end) =>
        loopAny(
            () => waitingFor(end),
            i => push(prefix(i)) || single())

    const blockquote = () => simpleList(() => ">", "blockquote_end")
    const ordered = () => simpleList(i => `${i + 1}.`, "list_end")
    const unordered = () => simpleList(() => "-", "list_end")
    const looseItem = () => simpleList(() => " ", "list_item_end")

    function listItem() {
        return loopAny(
            () => waitingFor("list_item_end"),
            () => tokens[index].type === "text"
                ? text(tokens[index])
                : single())
    }

    function single() {
        // Don't even bother if the compilation has already broken.
        if (end) return true

        const token = tokens[index]

        switch (token.type) {
        // Ignore tables and HTML
        case "table": return push(" ")
        case "html": return push(" ")

        case "space": return push(" ")
        case "hr": return push(" --- ")
        case "heading": return textItem(token.text)
        case "code": return codeBlock(token)
        case "blockquote_start": return blockquote()
        case "list_start": return token.ordered ? ordered() : unordered()
        case "list_item_start": return listItem(token)
        case "loose_item_start": return looseItem()
        case "paragraph": return textItem(token.text)
        case "text": return text(token)
        default: return false
        }
    }

    while (hasNext() && !single()) {
        index++
    }

    if (hasNext()) str += "..."

    // Cue to Node to flatten the string's internal representation
    return str.concat()
}
