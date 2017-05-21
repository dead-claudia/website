/* global m: false, marked: false, hljs: false, Promise: false */

(function () { // eslint-disable-line max-statements
    "use strict"

    /**
     * The (barely-existing) data model. A quick explanation:
     *
     * posts: The list of blog posts, with only metadata, but sorted by date.
     * This is retrieved with few modifications from ./blogs.json.
     *
     * tags: A mapping of tag -> post. Note that it references the post
     * directly, not the index. Also, all matches are case-insensitive.
     *
     * urls: A mapping of post url -> post. This is purely for resolving the URL
     * to a post without having to search the entirety of posts. It may be
     * currently insignificant, but that may change later on as I write more
     * blog posts.
     *
     * getTag(): Gets a list of posts from one or more comma-separated tags. If
     * either the tag isn't valid or no posts have that tag, then it returns an
     * empty list. Eventually, I might restructure the code to not be so bound
     * to the route parameter, and have validation happen only once.
     */

    function validateTag(tag) {
        return !tag || !/^[\w ,\-]+$/.test(tag)
    }

    var urls = Object.create(null)
    var posts, tags

    function getTag(tag) {
        if (tags == null) {
            tags = Object.create(null)
            posts.forEach(function (post) {
                post.tags.forEach(function (tag) {
                    tag = tag.toLowerCase()
                    tags[tag] = tags[tag] || []
                    if (tags[tag].indexOf(post) < 0) tags[tag].push(post)
                })
            })
        }

        if (!validateTag(tag)) return []

        var ret = []
        var cache = Object.create(null)

        // Remove the duplicates. The URL is the key for the posts, since
        // they all have unique URLs.
        tag.toLowerCase().split(/\s*,\s*/g).forEach(function (tag) {
            if (!tags[tag]) return
            tags[tag].forEach(function (post) {
                if (!cache[post.url]) {
                    cache[post.url] = true
                    ret.push(post)
                }
            })
        })

        return ret
    }

    var lastIsTags = false

    function sendView(tags) {
        // Avoid duplicate hits for tag searches.
        if (lastIsTags) return

        // Don't crash if Google Analytics doesn't load.
        try {
            var route = tags ? "/tags" : m.route.get()

            lastIsTags = !!tags
            window.ga("send", "pageview", location.pathname + route)
        } catch (_) {
            // ignore
        }
    }

    /**
     * The views.
     */

    /**
     * A component for a simple tag search with validation, even on load. Note
     * that the validation is duplicated by necessity in getTag as well.
     */
    var tagSearch = {
        oninit: function () {
            var tag = m.route.param("tag")

            // A null tag is valid.
            this.fail = tag != null && !validateTag(tag)

            // Set the initial value based on the URL.
            this.value = tag != null ? tag : ""
        },

        submit: function (e) {
            e = e || event

            // Not touching this...
            if (e.defaultPrevented) return

            // Just in case the browser has already dropped the legacy
            // versions or doesn't support the newer version.
            if ((e.which || e.keyCode) === 13 || e.key === "Enter") {
                e.preventDefault()
                e.stopPropagation()

                if (validateTag(this.value)) {
                    m.route.set("/tags/" + encodeURIComponent(this.value))
                } else {
                    this.fail = true
                }
            }
        },

        view: function () {
            var self = this

            return m(".tag-search", [
                m("label", "Search by tag:"),
                m("input[type=text]", {
                    value: this.value,
                    oninput: function (vnode) { self.value = vnode.dom.value },
                    onkeydown: this.submit.bind(this),
                }),
                !this.fail ? null : m(".warning", [
                    "Tags may only be a comma-separated list of phrases.",
                ]),
            ])
        },
    }

    /**
     * The header for the tag view, which requires a little more logic to
     * correctly display the tag.
     */
    var tagHeader = {
        oninit: function (vnode) {
            if (!validateTag(vnode.attrs.tag)) {
                this.banner = "Invalid vnode.attrs.tag: '" +
                    vnode.attrs.tag + "'"
            } else {
                var tags = vnode.attrs.tag.split(/\s*,\s*/g)
                var list

                if (tags.length === 1) {
                    list = "'" + tags[0] + "'"
                } else if (tags.length === 2) {
                    list = "'" + tags[0] + "' or '" + tags[1] + "'"
                } else {
                    var last = tags.pop()

                    list = ""
                    for (var i = 0; i < tags.length; i++) {
                        list += "'" + tags[i] + "', "
                    }

                    list += "'" + last + "'"
                }

                this.banner = "Posts tagged " + list + " (" + vnode.attrs.len +
                    " post" + (vnode.attrs.len === 1 ? "" : "s") + "):"
            }
        },

        view: function () {
            return m(".summary-header", [
                m(".summary-title", [
                    m(".tag-title", this.banner),
                    m("a.back", {href: "/", oncreate: m.route.link}, [
                        // "Back to posts ►" or "Back to posts \u25ba"
                        "Back to posts ", m.trust("&#9658;"),
                    ]),
                ]),
                m(tagSearch),
            ])
        },
    }

    function tagList(post, current) {
        return m(".post-tags", [
            m("span", "Tags:"),
            post.tags.map(function (tag) {
                return m("a.post-tag", {
                    class: tag === current ? ".post-tag-active" : "",
                    href: "/tags/" + tag,
                    config: m.route,
                }, tag)
            }),
        ])
    }

    function feed(type, href) {
        return m(".feed", [
            type,
            m("a", {href: href}, m("img.feed-icon[src=./feed-icon-16.gif]")),
        ])
    }

    /**
     * The combined summary and tag view. The two views are only different in
     * the information they display, not the format they're displayed in.
     *
     * Eventually, this needs to be paginated, but I don't see that being a
     * problem in the near term.
     */
    var summaryView = {
        oninit: function (vnode) {
            sendView(vnode.attrs.tag != null)
            if (vnode.attrs.tag != null) {
                this.tag = vnode.attrs.tag.toLowerCase()
                this.posts = getTag(this.tag)
            } else {
                this.tag = undefined
                this.posts = posts
            }
        },

        // To ensure the tag gets properly diffed on route change.
        onbeforeupdate: function (vnode) {
            this.oninit(vnode)
            return true
        },

        view: function () {
            return m(".blog-summary", [
                m("p", [
                    "My ramblings about everything (religion, politics, ",
                    "coding, etc.)",
                ]),

                m(".feeds", [
                    feed("Atom", "blog.atom.xml"),
                    feed("RSS", "blog.rss.xml"),
                ]),

                this.tag != null
                    ? m(tagHeader, {len: this.posts.length, tag: this.tag})
                    : m(".summary-header", [
                        m(".summary-title", "Posts, sorted by most recent."),
                        m(tagSearch),
                    ]),

                m(".blog-list", this.posts.map(function (post) {
                    return m("a.blog-entry", {
                        href: "/posts/" + post.url, oncreate: m.route.link,
                    }, [
                        m(".post-date", post.date.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })),

                        m(".post-stub", [
                            m(".post-title", post.title),
                            m(".post-preview", post.preview, "..."),
                        ]),

                        tagList(post, this.tag),
                    ])
                }, this)),
            ])
        },
    }

    var renderer = new marked.Renderer()

    // Since Marked doesn't wrap the code like it should for several
    // highlighters.
    renderer.code = function (code, lang) {
        return '<pre><code class="hljs hljs-' + lang + '">' +
            hljs.highlight(lang, code).value +
            "</code></pre>"
    }

    // Super simple sanitizer
    function sanitize(str) {
        return str.replace(/&<"/g, function (m) {
            if (m === "&") return "&amp;"
            if (m === "<") return "&lt;"
            return "&quot;"
        })
    }

    /**
     * Make Marked support specifying image size in pixels in this format:
     *
     * ![alt](href = x WIDTH "title")
     * ![alt](href = HEIGHT x "title")
     * ![alt](href = HEIGHT x WIDTH "title")
     *
     * Note: whitespace from the equals sign to the title/end of image is all
     * optional. Each of the above examples are equivalent to these below,
     * respectively:
     *
     * ![alt](href =xWIDTH "title")
     * ![alt](href =HEIGHTx "title")
     * ![alt](href =HEIGHTxWIDTH "title")
     *
     * Example usage:
     *
     * ![my image](https://example.com/my-image.png =400x600 "My image")
     */
    renderer.image = function (href, title, alt) {
        var exec = /\s=\s*(\d*%?)\s*x\s*(\d*%?)\s*$/.exec(href)

        if (exec) href = href.slice(0, -exec[0].length)
        var res = '<img src="' + sanitize(href) + '" alt="' + sanitize(alt)

        if (title) res += '" title="' + sanitize(title)
        if (exec && exec[1]) res += '" height="' + exec[1]
        if (exec && exec[2]) res += '" width="' + exec[2]
        return res + '">'
    }

    marked.setOptions({
        // I don't trust that the response isn't being spoofed or modified in
        // transit. Marked does sanitize properly, though.
        sanitize: true,
        renderer: renderer,
    })

    /**
     * Displays a post from a remotely stored Markdown file, with associated
     * metadata already retrieved from ./blog.json.
     */
    var postView = {
        oninit: function (vnode) {
            var self = this

            this.content = ""
            this.post = urls[vnode.attrs.post]

            // Return the literal data as a string. It's markdown, not JSON.
            m.request("./blog/" + this.post.url, {
                background: true,
                deserialize: function (data) { return data },
            }).then(function (data) {
                self.content = marked(data)
                if (self.content) m.redraw()
            })
        },

        view: function () {
            return m(".blog-post", m(".blog-post-wrapper", [
                //                           "Home ►"
                m("a.post-home", {href: "/", oncreate: m.route.link}, [
                    "Home \u25ba",
                ]),
                m("h3.post-title", this.post.title),
                m(".post-body", [
                    this.content
                        ? m.trust(this.content)
                        : m(".post-loading", "Loading..."),
                ]),
                m(".post-footer", [
                    //                           "Home ►"
                    m("a.post-home", {href: "/", oncreate: m.route.link}, [
                        "Home \u25ba",
                    ]),
                    tagList(this.post),
                ]),
            ]))
        },
    }

    /**
     * Get ./blog.json and parse it accordingly.
     */
    var blogRequest = m.request("./blog.json").then(function (data) {
        posts = data.posts

        // My timezone offset is -5 hours, and I need to display that correctly.
        // This calculates the correct relative offset in milliseconds, which
        // should be 0 if in EST (i.e. offset of -5 hours).
        var offset = 60 * 1000 *
            (new Date().getTimezoneOffset() - 5 * 60)

        // Note that the posts are already sorted with respect to date.
        posts.forEach(function (post) {
            // Parse each date an actual Date instance.
            post.date = new Date(Date.parse(post.date) + offset)

            // So I'm not doing an O(n) search for each blog post later.
            urls[post.url] = post
        })

        // The posts should be sorted by reverse date.
        posts.sort(function (a, b) { return b.date - a.date })
    })

    /**
     * The entry point.
     */

    var loaded = new Promise(function (resolve) {
        document.addEventListener("DOMContentLoaded", function () {
            resolve()
            if (posts != null) return
            // Show a helpful bit of info if the blog posts are being slow to
            // load for whatever reason.
            m.render(document.getElementById("blog"), [
                m("p", "Loading..."),
                m("p", [
                    "If this text doesn't disappear within a few seconds, you ",
                    "may have to reload the page, as the blog is loading ",
                    "slowly. If that doesn't help (as in you still see this ",
                    "message after reloading), then ",
                    m("a[href=contact.html]", "please tell me"), ". As soon ",
                    "as I get the message, I'll try to get it fixed as soon ",
                    "as I can.",
                ]),
                m("p", [
                    "If you happen to use GitHub, you can also tell me ",
                    m("a[href=https://github.com/isiahmeadows/website]", "here"),
                    ", and if you'd like, feel free to help me fix whatever ",
                    "it is.",
                ]),
            ])
        })
    })

    // Redraw with the actual data once it is loaded.
    Promise.all([blogRequest, loaded]).then(function () {
        m.route.prefix("#")
        m.route(document.getElementById("blog"), "/", {
            "/": summaryView,
            "/tags/:tag": summaryView,
            "/posts/:post": {
                onmatch: function (params) {
                    return urls[params.post] ? postView : m.route.set("/")
                },
            },
        })
    })
})()
