/* global m: false, marked: false, hljs: false */
(function () { // eslint-disable-line max-statements
    "use strict"

    // I need better error logging than the weirdness that Mithril seems to have
    // in that it doesn't print most native errors (even though I previously
    // patched this, it doesn't seem to have carried over in the 80% revert).
    m.deferred.onerror = (function () {
        var old = m.deferred.onerror

        return function (e) {
            if (typeof console !== "undefined" && console.error) {
                console.error(e)
            }
            return old(e)
        }
    })()

    /**
     * Useful utilities
     */

    /**
     * A more class-like component, complete with `init`. Simpler to
     * conceptualize than a two-part controller + view.
     */
    function component(obj) {
        function C() {
            this.init.apply(this, arguments)
        }
        C.prototype = obj
        return {
            controller: C,
            view: function (ctrl) {
                var args = []

                for (var i = 1; i < arguments.length; i++) {
                    args.push(arguments[i])
                }
                return ctrl.view.apply(ctrl, args)
            },
        }
    }

    /**
     * Sugar for a stateless component, since this somehow seems to not be
     * useful or enough for core...
     */
    function pure(view) {
        return {
            view: function () {
                var args = []

                for (var i = 1; i < arguments.length; i++) {
                    args.push(arguments[i])
                }
                return view.apply(null, args)
            },
        }
    }

    // So I'm not typing out this crap every time.
    function route(href) {
        return {href: href, config: m.route}
    }

    /**
     * The views.
     */

    /**
     * The view for each blog post preview item.
     */
    var previewItem = pure(function (post, isTag) {
        return m(".blog-summary-item", [
            m(".post-date", post.date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })),

            m("a.post-stub", route("/posts/" + post.url), [
                m(".post-title", post.title),
                m(".post-preview", post.preview, "..."),
            ]),

            m(".post-tags", m("span", "Tags:"), post.tags.map(function (tag) {
                var active = isTag && tag === m.route.param("tag").toLowerCase()

                return m("a.post-tag" + (active ? ".post-tag-active" : ""),
                    route("/tags/" + tag),
                    tag)
            })),
        ])
    })

    function validateTag(tag) {
        return tag != null && /^[\w ,\-]+$/.test(tag)
    }

    function splitTag(tag) {
        return tag != null ? tag.split(/\s*,\s*/g) : []
    }

    /**
     * A component for a simple tag search with validation, even on load. Note
     * that the validation is duplicated by necessity in getTag as well.
     */
    var tagSearch = component({
        init: function () {
            var tag = m.route.param("tag")

            // A null tag is valid.
            this.fail = m.prop(tag != null && !validateTag(tag))

            // Set the initial value based on the URL.
            this.value = m.prop(tag != null ? tag : "")

            this.onsubmit = function (e) {
                e = e || event

                // Not touching this...
                if (e.defaultPrevented) return

                // Just in case the browser has already dropped the
                // legacy versions or doesn't support the newer version.
                if ((e.which || e.keyCode) === 13 || e.key === "Enter") {
                    e.preventDefault()
                    e.stopPropagation()

                    if (validateTag(this.value())) {
                        m.route("/tags/" + encodeURIComponent(this.value()))
                    } else {
                        this.fail(true)
                    }
                }
            }
        },

        view: function () {
            return m(".tag-search", [
                m("label", "Search for tag:"),
                m("input[type=text]", {
                    value: this.value(),
                    oninput: m.withAttr("value", this.value),
                    onkeydown: this.onsubmit.bind(this),
                }),
                this.fail() ? m(".warning", [
                    "Tags may only be a comma-separated list of phrases.",
                ]) : null,
            ])
        },
    })

    /**
     * The header for the basic summary loaded by default.
     */
    var summaryHeader = pure(function () {
        return m(".summary-header", [
            m(".summary-title", "Posts, sorted by most recent."),
            m(tagSearch),
        ])
    })

    function pluralize(word, count) {
        if (count === 1) return word
        if (/[aeiou]$/.test(word)) return word + "es"
        return word + "s"
    }

    /**
     * The header for the tag view, which requires a little more logic to
     * correctly display the tag.
     */
    var tagHeader = component({
        init: function () {
            // So I'm not repeating this computation on every render.
            var tag = this.tag = m.route.param("tag")

            if (validateTag(tag)) {
                var tags = splitTag(tag)

                if (tags.length === 1) {
                    this.list = "'" + tags[0] + "'"
                } else if (tags.length === 2) {
                    this.list = "'" + tags[0] + "' or '" + tags[1] + "'"
                } else {
                    var last = tags.pop()

                    this.list = tags.map(function (tag) {
                        return "'" + tag + "'"
                    }).join(", ") + ", or '" + last + "'"
                }
            }
        },

        view: function (len) {
            return m(".summary-header", [
                m(".summary-title", [
                    m(".tag-title", [
                        validateTag(this.tag)
                            ? [
                                "Posts tagged ", this.list, " (", len,
                                " ", pluralize("post", len), "):",
                            ]
                            : ["Invalid tag: '", this.tag, "'"],
                    ]),
                    m("a.back", route("/"), [
                        // "Back to posts ►" or "Back to posts \u25ba"
                        "Back to posts ", m.trust("&#9658;"),
                    ]),
                ]),
                m(tagSearch),
            ])
        },
    })

    /**
     * The combined summary and tag view. The two views are only different in
     * the information they display, not the format they're displayed in.
     *
     * Eventually, this needs to be paginated, but I don't see that being a
     * problem in the near term.
     */
    var summaryView = pure(function (posts, isTag) {
        return m(".blog-summary", [
            m("p", [
                "My ramblings about everything (religion, politics, coding, ",
                "etc.)",
            ]),
            isTag ? m(tagHeader, posts.length) : m(summaryHeader),
            m(".blog-list", [
                posts.map(function (post) {
                    return m(previewItem, post, isTag)
                }),
            ]),
        ])
    })

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
        var exec = /\s=\s*(\d*)\s*x\s*(\d*)\s*$/.exec(href)

        if (exec) href = href.slice(0, -exec[0].length)
        var res = '<img src="' + sanitize(href) + '" alt="' + sanitize(alt)

        if (exec && exec[1]) res += '" height="' + exec[1]
        if (exec && exec[2]) res += '" width="' + exec[2]
        return res + '">'
    }

    marked.setOptions({
        // I don't trust that the response isn't being spoofed or
        // modified in transit. Marked does sanitize properly, though.
        sanitize: true,

        renderer: renderer,
    })

    /**
     * Displays a post from a remotely stored Markdown file, with associated
     * metadata already retrieved from ./blog.json.
     */
    var postView = component({
        init: function (post) {
            var content = this.content = m.prop()

            m.request({
                method: "GET",
                url: "./blog/" + post.url,
                // Return the literal data as a string. It's markdown, not JSON.
                deserialize: function (data) { return data },
            }).then(function (data) {
                if (content(marked(data))) m.redraw()
            })
        },

        view: function (post) {
            return m(".blog-post", [
                m("h3.post-title", post.title),
                m(".post-body", [
                    this.content() != null
                        ? m.trust(this.content())
                        : m(".post-loading", "Loading..."),
                ]),
                //                           "Home ►" or "Home \u25ba"
                m("a.post-home", route("/"), "Home ", m.trust("&#9658;")),
            ])
        },
    })

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

    var posts = m.prop()
    var tags
    var urls = {}

    function initTags() {
        // The tags will retain the post sort, because this transformation
        // doesn't modify the order. Also, it's deduplicated.
        tags = {}
        posts().forEach(function (post) {
            post.tags.forEach(function (tag) {
                tag = tag.toLowerCase()
                var result = tags[tag] = tags[tag] || []

                if (result.indexOf(post) < 0) result.push(post)
            })
        })
    }

    function getTag(tag) {
        if (tags == null) initTags()
        if (!validateTag(tag)) return []

        var ret = []
        var cache = {}

        // Remove the duplicates. The URL is the key for the posts, since they
        // all have unique URLs.
        splitTag(tag.toLowerCase()).forEach(function (tag) {
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

    /**
     * Get ./blog.json and parse it accordingly.
     */

    var loaded = false

    m.request({method: "GET", url: "./blog.json"}).then(function (data) {
        // My timezone offset is -5 hours, and I need to display that
        // correctly. This calculates the correct relative offset in
        // milliseconds, which should be 0 if in EST (i.e. offset of -5 hours).
        var offset = 60 * 1000 * (new Date().getTimezoneOffset() - 5 * 60)

        posts(data.posts).forEach(function (post) {
            // Parse each date an actual Date instance.
            post.date = new Date(Date.parse(post.date) + offset)

            // So I'm not doing an O(n) search for each blog post later.
            urls[post.url] = post
        })

        // The posts should be sorted by reverse date.
        posts().sort(function (a, b) { return b.date - a.date })

        // Don't know why Mithril can't redraw at the end of an AJAX call like
        // it's supposed to (if I understand the source code correctly). Also,
        // only call this if the DOM is already loaded, so it doesn't throw a
        // fit over the DOM root not existing yet if the request isn't slow (and
        // it usually isn't).
        if (loaded) m.route(m.route())
    })

    /**
    * The entry point.
    */
    document.addEventListener("DOMContentLoaded", function () {
        // Show a helpful bit of info if Mithril is being uncooperative in
        // loading its routes (I know it's likely a Mithril routing bug, but not
        // something I have time to fix ATM).
        //
        // I don't actually mention this in
        // the alert, since I don't want to make the assumption it's *only* tech
        // people that read this thing. I blog about more than just developer
        // stuff, so I know it's not a safe assumption to make.
        document.getElementById("info").innerHTML =
            "<p>Loading...</p>" +
            "<p>If this text doesn't disappear within a few " +
            "seconds, you may have to reload the page. The JavaScript is " +
            "sometimes a little finicky loading. If that doesn't help (i.e. " +
            "you see this message again after reloading), then " +
            "<a href='contact.html'>please tell me</a>. As soon as I get the " +
            "message, I'll try to get it fixed as soon as I can.</p>" +
            "<p>If you happen to use GitHub, you can also tell me " +
            "<a href='https://github.com/isiahmeadows/website'>here</a>, and " +
            "if you'd like, feel free to help me fix whatever it is.</p>"

        function base(view) {
            return pure(function () {
                return posts() ? view() : m(".blog-loading", "Loading...")
            })
        }

        loaded = true
        m.route.mode = "hash"
        m.route(document.getElementById("blog"), "/", {
            "/": base(function () {
                return m(summaryView, posts())
            }),

            "/posts/:post": base(function () {
                return m(postView, urls[m.route.param("post")])
            }),

            "/tags/:tag": base(function () {
                return m(summaryView, getTag(m.route.param("tag")), true)
            }),
        })
    })
})()
