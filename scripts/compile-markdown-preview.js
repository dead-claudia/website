"use strict"

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

class FragmentCompiler {
    constructor(src) {
        this.tokens = marked.lexer(src)
        this.index = 0
        this.str = ""
        this.break = false
    }

    peek() { return this.tokens[this.index + 1] }
    next() { return this.tokens[++this.index] }

    hasNext() { return !this.break && this.index < this.tokens.length }

    compile() {
        while (this.hasNext() && !this.single()) {
            this.index++
        }
        // Cue to Node to flatten the string's internal representation
        return this.str.concat()
    }

    push(str) {
        // Safety check.
        if (this.break) return true

        // Prevent more than single spaces from getting in in the first place.
        // This won't be a perf problem, since the length limit is relatively
        // low, in which the compilation will abort anyways.
        if (str === " ") return false

        str = str.replace(/\s+/g, " ").trim()
        if (str === "") return false

        this.str += str

        if (this.str.length > PREVIEW_LENGTH) {
            // Break compilation.
            this.break = true
            this.str = cap(this.str)
            return true
        }

        this.str += " "
        return false
    }

    waitingFor(tok) {
        return this.hasNext() && this.next().type !== tok
    }

    textItem(src) {
        return this.push(sanitizeHtml(inlineLexer.output(src), {
            allowedTags: [],
            allowedAttributes: [],
        }))
    }

    text(token) {
        let body = token.text
        while (this.hasNext() && this.peek().type === "text") {
            body += ` ${this.next().text}`
        }
        return this.textItem(body)
    }

    codeBlock(token) {
        return this.push(`\`\`\`${token.lang}`) &&
            this.push(token.code.trim()) &&
            this.push("```")
    }

    simpleList(prefix, end) {
        while (this.waitingFor(end)) {
            if (this.push(prefix) || this.single()) return true
        }
        return false
    }

    blockquote() {
        return this.simpleList(">", "blockquote_end")
    }

    ordered() {
        for (let i = 0; this.waitingFor("list_end"); i++) {
            if (this.push(`${i}.`) || this.single()) return true
        }
        return false
    }

    unordered() {
        return this.simpleList("-", "list_end")
    }

    listItem() {
        while (this.waitingFor("list_item_end")) {
            if (this.tokens[this.index].type === "text") {
                if (this.text(this.tokens[this.index])) return true
            } else if (this.single()) {
                return true
            }
        }
    }

    looseItem() {
        return this.simpleList(" ", "list_item_end")
    }

    single() {
        // Don't even bother if the compilation has already broken.
        if (this.break) return true

        const token = this.tokens[this.index]

        switch (token.type) {
        // Ignore tables and HTML
        case "table": return this.push(" ")
        case "html": return this.push(" ")

        case "space": return this.push(" ")
        case "hr": return this.push(" --- ")
        case "heading": return this.textItem(token.text)
        case "code": return this.codeBlock(token)
        case "blockquote_start": return this.blockquote()

        case "list_start":
            return token.ordered ? this.ordered() : this.unordered()

        case "list_item_start": return this.listItem(token)
        case "loose_item_start": return this.looseItem()
        case "paragraph": return this.textItem(token.text)
        case "text": return this.text(token)
        }
    }
}

module.exports = src => new FragmentCompiler(src).compile()
