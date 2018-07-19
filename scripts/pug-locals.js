"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

module.exports = (FILE, minified, extra = {}) => {
    let pageColor

    if (FILE === "/index.html") pageColor = "l0"
    else if (FILE.startsWith("/about")) pageColor = "l1"
    else if (FILE.startsWith("/music")) pageColor = "l1"
    else if (FILE.startsWith("/showcase")) pageColor = "l2"
    else if (FILE.startsWith("/blog")) pageColor = "l3"
    else if (FILE.startsWith("/contact")) pageColor = "l4"
    else throw new ReferenceError(`Template not registered: ${FILE}`)

    let pageCSS = FILE.replace(/\.html$/, ".css")

    if (FILE.startsWith("/blog")) pageCSS = "/blog/index.css"
    if (FILE.startsWith("/music/songs")) pageCSS = "/music/songs/index.css"

    return {
        FILE, minified, pageColor, pageCSS, ...extra,

        navAttrs(parent) {
            if (FILE.startsWith(parent)) {
                return {href: parent, class: "selected"}
            } else {
                return {href: parent}
            }
        },

        assert(cond, message, ErrorType) {
            if (ErrorType == null) ErrorType = Error
            if (!cond) throw new ErrorType(message)
        },
    }
}
