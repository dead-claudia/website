"use strict"

// Check for trailing newlines and no trailing whitespace in everything not
// binary or JS (which is already checked by ESLint). If a line break is needed
// in Markdown-land, use `<br>`, not an extra space.

const fs = require("fs")
const path = require("path")

const pcall = require("./promise.js")
const walk = require("./walk.js")

// This only can check files.
function ignore(file) {
    // These directories should be wholly ignored.
    if (file === "node_modules" || file === "dist") return true
    if (/^\.git/.test(file)) return true

    // Keep this list in sync with that in `/.gitattributes`. Note that JS is
    // also ignored because ESLint already checks for it.
    return /\.(js|png|jpg|jpeg|svg|ttf|eot|woff2?)$/i.test(file)
}

function check(code, file, item, re) {
    if (re.test(file.contents)) {
        const name = path.relative(path.dirname(__dirname), file.name)

        console.error(`WARNING: Trailing ${item} in ${name}.`)
        return 1
    } else {
        return code
    }
}

walk(path.dirname(__dirname), ignore)
.then(files => Promise.all(files.map(name =>
    pcall(fs.readFile, name, "utf-8").then(contents => ({name, contents})))))
.then(files => files.reduce((code, file) => {
    // Test for any non-line-break whitespace that precedes a line-break
    // whitespace and reject it.
    code = check(code, file, "whitespace found", /[^\r\n\S][\r\n]/)

    // Test for *one* trailing line break.
    code = check(code, file, "newline missing", /[^\r\n\S]$|(\r\n|\r|\n){2,}$/)

    return code
}, 0))
.then(process.exit)
.catch(e => {
    console.error(e.stack)
    return process.exit(1) // eslint-disable-line no-process-exit
})
