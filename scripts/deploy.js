"use strict"

// Much easier to deal with synchronously here than async in the makefile

const fs = require("fs")
const path = require("path")
const spawn = require("child_process").spawnSync

function exec(cmd, use) {
    cmd = cmd.split(/\s+/g)
    return spawn(cmd[0], cmd.slice(1), {
        stdio: ["inherit", use ? "pipe" : "inherit", "inherit"],
        // Make the current working directory the parent root.
        cwd: path.dirname(__dirname),
    })
}

function bail(message) {
    if (message) console.error(message)
    process.exit(1)
}

try {
    if (fs.statSync(path.resolve(__dirname, "../dist")).isDirectory()) {
        bail("`dist` must be a directory!")
    }
} catch (e) {
    if (e.code === "ENOENT") bail("`dist` must exist!")
    else bail(e.message)
}

let ret = exec("git symbolic-ref HEAD", true)
if (!ret.status || ret.stdout.toString("utf-8") !== "refs/heads/master") {
    bail("Current branch must be `master` to deploy!")
}

ret = exec("git show-ref -q --verify ref/heads/gh-pages")
if (!ret.status) bail("`gh-pages` branch must exist!")

ret = exec("git branch -D gh-pages")
if (!ret.status) bail("`gh-pages` branch must exist!")

ret = exec("git subtree split --prefix dist -b gh-pages")
if (!ret.status) bail()
ret = exec("git push -f origin gh-pages:gh-pages")
if (!ret.status) bail()
