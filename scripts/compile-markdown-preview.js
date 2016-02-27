"use strict"

// `next()` has a completely different meaning here.
/* eslint-disable callback-return */

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

// I need a parser that can be aborted during processing, because I don't need
// to parse a whole file - I only need a set number of characters, devoid of
// HTML tags. Marked's parser, like most recursive-descent parsers, have no
// facilities to do both efficiently.

const marked = require("marked")
const sanitizeHtml = require("sanitize-html")

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

module.exports = src => {
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

    // Cue to Node to flatten the string's internal representation
    return str.concat()
}
