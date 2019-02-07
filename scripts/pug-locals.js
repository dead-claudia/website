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

        // I actually parse the CC license so I don't have to hardcode
        // everything.
        parseCCLicense(name) {
            const url = `https://creativecommons.org/licenses/${name}/`
            const icon = `https://i.creativecommons.org/l/${name}/88x31.png`
            const [license, version, port] = name.split(/\//g)
            let title = "Creative Commons "

            switch (license) {
            case "by":
                title += "Attribution"
                break

            case "by-sa":
                title += "Attribution-ShareAlike"
                break

            case "by-nd":
                title += "Attribution-NoDerivs"
                break

            case "by-nc":
                title += "Attribution-NonCommercial"
                break

            case "by-nc-sa":
                title += "Attribution-NonCommercial-ShareAlike"
                break

            case "by-nc-nd":
                title += "Attribution-NonCommercial-NoDerivs"
                break

            default: throw new Error(`Unknown license descriptor: ${name}`)
            }
            title += ` ${version} `
            switch (port) {
            case undefined: title += "International"; break
            case "us": title += "United States"; break
            default: throw new Error(`Unknown license port: ${name}`)
            }
            title += "License"
            return {url, icon, title}
        },
    }
}
