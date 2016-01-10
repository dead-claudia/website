"use strict"

// Much easier to deal with synchronously here than async in the makefile

const fs = require("fs")
const path = require("path")
const spawn = require("child_process").spawnSync

function exec(cmd, use) {
    cmd = cmd.split(/\s+/g)
    // Make the current working directory the parent root.
    const opts = {cwd: path.dirname(__dirname)}
    if (use) opts.stdio = ["inherit", "pipe", "inherit"]
    return spawn(cmd[0], cmd.slice(1), opts)
}

function bail(message) {
    if (message) console.error(message)
    process.exit(1)
}

try {
    if (!fs.statSync(path.resolve(__dirname, "../dist")).isDirectory()) {
        bail("`dist` must be a directory!")
    }
} catch (e) {
    if (e.code === "ENOENT") bail("`dist` must exist!")
    else bail(e.message)
}

const ret = exec("git symbolic-ref HEAD", true)
if (ret.status > 0) bail()
if (ret.stdout.toString("utf-8") !== "refs/heads/master") {
    bail("Current branch must be `master` to deploy!")
}

if (exec("git show-ref -q --verify ref/heads/gh-pages").status > 0) {
    bail("`gh-pages` branch must exist!")
}

if (exec("git subtree split --prefix dist -b gh-pages").status > 0) bail()
if (exec("git push -f origin gh-pages:gh-pages").status > 0) bail()
