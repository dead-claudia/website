"use strict"

// Much easier to deal with synchronously here than async in the makefile

const fs = require("fs")
const path = require("path")
const spawn = require("child_process").spawnSync

function exec(cmd, use) {
    cmd = cmd.split(/\s+/g)
    return spawn(cmd[0], cmd.slice(1), {
        // Make the current working directory the parent root.
        cwd: path.resolve(__dirname, "../.."),
        stdio: use ? ["inherit", "pipe", "inherit"] : "inherit",
    })
}

function bail(message) {
    console.error(message || new Error().stack)
    process.exit(1) // eslint-disable-line no-process-exit
}

try {
    if (!fs.statSync(path.resolve(__dirname, "../../dist")).isDirectory()) {
        bail("`dist` must be a directory!")
    }
} catch (e) {
    if (e.code === "ENOENT") bail("`dist` must exist!")
    else bail(e.message)
}

const ret = exec("git symbolic-ref HEAD", true)

if (ret.status > 0) bail()
if (ret.stdout.toString("utf-8").trim() !== "refs/heads/master") {
    bail("Current branch must be `master` to deploy!")
}

if (exec("git show-ref -q --verify refs/heads/gh-pages").status > 0) {
    bail("`gh-pages` branch must exist!")
}

if (exec("git subtree split --prefix dist -b gh-pages").status > 0) bail()
if (exec("git push -f origin gh-pages:gh-pages").status > 0) bail()
