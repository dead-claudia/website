// Adapted from Express's `morgan`, but specialized for their `common` template
// and with all the 10%-used dependencies and other extra nonsense stripped out.
"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const CLF_MONTH = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function pad2(num) {
    return `${num}`.padStart(2, "0")
}

const CREDENTIALS = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/
const USERNAME = /^([^:]*):/

module.exports = function (req, res) {
    const {remoteAddress} = req.connection

    function handler(err) {
        res.connection.removeListener("error", handler)
        res.connection.removeListener("close", handler)
        if (err) { console.error(err); return }
        let line = remoteAddress ||
            req.connection && req.connection.remoteAddress ||
            "<disconnected>"

        line += " - "
        const auth = req.getHeader("authorization")

        if (auth) {
            const match = CREDENTIALS.exec(auth)

            if (match) {
                const userPass = USERNAME.exec(
                    Buffer.from(match[1], "base64").toString()
                )

                if (userPass) line += userPass[1]
            }
        }

        const now = new Date()

        line += ` [${pad2(now.getUTCDate())}/${CLF_MONTH[now.getUTCMonth()]}/`
        line += `${now.getUTCFullYear()}:${pad2(now.getUTCHours())}:`
        line += `${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}`
        line += ` +0000] "${req.method} ${req.url}`
        line += ` HTTP/${req.httpVersionMajor}.${req.httpVersionMinor}" `
        if (res.headersSent) {
            let header = res.getHeader("content-length")

            if (Array.isArray(header)) header = header.join(", ")
            line += `${res.statusCode} ${header}`
        }
        process.stdout.write(`${line}\n`)
    }

    res.connection.on("error", handler)
    res.connection.on("close", handler)
}
