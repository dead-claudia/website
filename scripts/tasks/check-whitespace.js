#!/usr/bin/env node
"use strict"

// Check for trailing newlines and no trailing whitespace in everything not
// binary or JS (which is already checked by ESLint). If a line break is needed
// in Markdown-land, use `<br>`, not an extra space.

const fs = require("fs")
const path = require("path")

const {pcall, walk} = require("../util")

function check(name, contents, item, re) {
    let line = 1
    let column = 0
    let index = 0

    while (true) {
        const end = contents.indexOf(re, index)

        if (end < 0) return
        while (index !== end) {
            switch (contents.charCodeAt(index++)) {
            case 0x0A: // \r
                if (
                    index !== end &&
                    contents.charCodeAt(index) === 0x0D // \n
                ) index++
                // falls through

            case 0x0D: // \n
                line++
                column = 0
                break

            default:
                column++
            }
        }
        index++

        console.error(
            `WARNING (line ${line}, column ${column}): ` +
            `Trailing ${item} in ${name}.`
        )
        process.exitCode = 1
    }
}

console.log("Linting whitespace in non-JS files...")

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
    const contents = await pcall(cb => fs.readFile(file, "utf-8", cb))
    const name = path.relative(path.dirname(__dirname), file)

    // Test for any non-line-break whitespace that precedes a line-break
    // whitespace and reject it.
    check(name, contents, "whitespace found", /[^\r\n\S][\r\n]/)

    // Test for *one* trailing line break.
    check(name, contents, "newline missing", /[^\r\n\S]$|(\r\n|\r|\n){2,}$/)
})
