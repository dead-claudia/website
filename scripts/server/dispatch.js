"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

module.exports = (req, url, headers) => {
    if (req.method !== "GET" && req.method !== "HEAD") return 501

    // Prevent caching
    headers["Pragma"] = "no-cache"
    headers["Cache-Control"] =
        "no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0," +
        "pre-check=0"
    headers["Expires"] = "0"

    if (url.endsWith("/README.md")) return 404
    if (url.startsWith("/mixins/")) return 404
    if (url.startsWith("/templates/")) return 404
    if (url.endsWith(".pug")) return 404
    if (url.endsWith(".styl")) return 404
    if (url.endsWith("/")) url += "index.html"

    switch (url) {
    case "/blog/atom.xml": return {type: "feed", format: "atom-1.0"}
    case "/blog/rss.xml": return {type: "feed", format: "rss-2.0"}
    case "/blog/index.html": return {type: "blog"}
    default:
        if (url.endsWith(".css")) return {type: "stylus", url}
        if (!url.endsWith(".html")) return {type: "static", url}
        if (url.startsWith("/music/songs/")) return {type: "song", url}
        if (url.startsWith("/blog/")) return {type: "post", url}
        return {type: "page", url}
    }
}
