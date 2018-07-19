"use strict"

// Check for trailing newlines and no trailing whitespace in everything not
// binary or JS (which is already checked by ESLint). If a line break is needed
// in Markdown-land, use `<br>`, not an extra space.

const {promises: fs} = require("fs")
const path = require("path")

const walk = require("./walk")

function getLineData(contents, pos, start) {
    let line = 1
    let column = 0

    for (let i = start; i !== pos; i++) {
        switch (contents.charCodeAt(i)) {
        case 0x0A: // \r
            if (i + 1 !== pos && contents.charCodeAt(i + 1) === 0x0D) i++
            // falls through

        case 0x0D: // \n
            line++
            column = 0
            break

        default:
            column++
        }
    }

    return {line, column}
}

function check(file, contents, item, re) {
    while (true) {
        const result = re.exec(contents)

        if (result == null) break
        const name = path.relative(path.dirname(__dirname), file)
        const {line, column} = getLineData(result.index, re.lastIndex)

        console.error(
            `WARNING (line ${line}, column ${column}): ` +
            `Trailing ${item} in ${name}.`
        )
        process.exitCode = 1
    }
}

walk("**", {
    cwd: path.dirname(__dirname),
    // These directories should be wholly ignored.
    ignore: ["!../node_modules/**", "!../dist/**"].concat(
        // Keep this list in sync with that in `/.gitattributes`. Note that JS
        // is also ignored to not duplicate ESLint's check.
        "js,png,jpg,jpeg,svg,ttf,eot,woff,woff2".split(",")
            .map(ext => `!**/*.${ext}`)
    ),
    nodir: true,
}, async file => {
    const contents = await fs.readFile(file, "utf-8")

    // Test for any non-line-break whitespace that precedes a line-break
    // whitespace and reject it.
    check(file, contents, "whitespace found", /[^\r\n\S][\r\n]/g)

    // Test for *one* trailing line break.
    check(file, contents, "newline missing", /[^\r\n\S]$|(\r\n|\r|\n){2,}$/g)
})
