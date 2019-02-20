"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

const path = require("path")
const mime = require("mime")
const statuses = require("statuses")
const escapeHtml = require("escape-html")
const finalhandler = require("finalhandler")

function getRedirectBody(res, data) {
    if (res.getHeader("content-type") === "text/plain") {
        return `${statuses[302]}. Redirecting to ${data}`
    } else if (res.getHeader("content-type") === "text/html") {
        const u = escapeHtml(data)

        return `<p>${statuses[302]}. Redirecting to <a href="${u}">${u}</a></p>`
    } else {
        return ""
    }
}

async function getBody(res, action, render) {
    if (typeof action === "number") {
        res.statusCode = action
        return statuses[action]
    } else {
        const body = await render(res, action)

        if (!Array.isArray(body)) return body
        const [status, data] = body

        res.statusCode = status
        if (status === 302) {
            res.setHeader("Location", data)
            return getRedirectBody(res)
        } else {
            return data
        }
    }
}

module.exports = ({dispatch, render, logger}) => async (req, res) => {
    logger(req, res)

    const bail = finalhandler(req, res, {
        env: "development",
        onerror(e) {
            console.error(e.stack || e.toString())
        },
    })

    try {
        const url = path.posix.resolve("/", req.path)
        const headers = Object.create(null)
        const action = await dispatch(req, url, headers)

        if (action == null) {
            throw new TypeError(
                "`dispatch` must return either a status or action object!"
            )
        }

        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value)
        }

        if (!res.hasHeader("content-type")) {
            res.setHeader("content-type", mime.getType(url) || "text/plain")
        }

        const body = await getBody(res, action, render)

        if (body != null) {
            res.setHeader("content-length", Buffer.byteLength(body))
        }

        if (body == null || req.method === "HEAD") {
            res.end()
        } else {
            res.end(body)
        }
    } catch (e) {
        bail(e.code === "ENOENT" || e.view != null ? null : e)
    }
}
