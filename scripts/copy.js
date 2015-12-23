"use strict"

// Pulled out into a separate file for parallelization.

const fs = require("fs")

function error(err) {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
}

fs.createReadStream(process.argv[2]).on("error", error)
.pipe(fs.createWriteStream(process.argv[3])).on("error", error)
