/* global m: false, marked: false, DISQUS: false */
(function () {
    "use strict"

    function pure(view) {
        return {view: view}
    }

    function route(href) {
        return {href: href, config: m.route}
    }

    // Don't know why Mithril can't redraw at the end of an AJAX call like it's
    // supposed to.
    function forceReload() {
        m.route(m.route())
    }

    /**
     * The views.
     */

    var itemView = pure(function (_, post) {
        return m("a", route("/posts/" + post.url), [
            m(".blog-summary-item", [
                m(".post-date", post.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    // The blog posts are dated as if they were UTC, although
                    // I'm technically in UTC-5. I just don't feel like
                    // repeatedly adding `EST` by hand after every single date
                    // in every single blog post.
                    timeZone: "UTC",
                })),
                m(".post-title", post.title),
                m(".post-preview", post.preview),
                m(".post-tags", post.tags.map(function (tag) {
                    return m("a.post-tag", route("/tags/" + tag), tag)
                })),
            ]),
        ])
    })

    var summaryView = pure(function (_, posts, isTag) {
        return m(".blog-summary", {className: isTag ? "tags" : "posts"}, [
            m("p", [
                "My ramblings about everything (religion, politics, coding, ",
                "etc.)",
            ]),
            posts.map(function (post) { return m(itemView, post) }),
        ])
    })

    /**
     * The Disqus integration component. Heavily modeled after an equivalent
     * React component: https://github.com/mzabriskie/react-disqus-thread
     */
    var disqusThread = {
        DISQUS_CONFIG: [
            "shortname", "identifier", "title", "url", "category_id",
            "onNewComment",
        ],

        __disqusAdded: m.prop(false),

        copyProps: function (context, props, prefix) {
            prefix = prefix || ""
            for (var prop in props) if ({}.hasOwnProperty.call(props, prop)) {
                if (prop === "onNewComment") continue
                context[prefix + prop] = props[prop]
            }

            if (typeof props.onNewComment === "function") {
                context[prefix + "config"] = function () {
                    this.callbacks.onNewComment = [
                        function (comment) { props.onNewComment(comment) },
                    ]
                }
            }
        },

        resetDisqus: function (page, props) {
            DISQUS.reset({
                reload: true,
                config: function () {
                    disqusThread.copyProps(this.page, props)

                    // Disqus needs hashbang URL, see
                    // https://help.disqus.com/customer/portal/articles/472107
                    this.page.url = this.page.url.replace(/#/, "") +
                        "#!newthread"
                },
            })
        },

        controller: function (props) {
            this.addDisqusScript = function () {
                if (disqusThread.__disqusAdded()) return

                var child = this.disqus = document.createElement("script")
                var parent = document.getElementsByTagName("head")[0] ||
                document.getElementsByTagName("body")[0]

                child.async = true
                child.type = "text/javascript"
                child.src = "//isiahmeadows.disqus.com/embed.js"

                parent.appendChild(child)
                disqusThread.__disqusAdded(true)
            }

            this.loadDisqus = function () {
                var thisProps = {}

                // Extract Disqus props that were supplied to this component
                disqusThread.DISQUS_CONFIG.forEach(function (prop) {
                    if (props[prop]) thisProps[prop] = props[prop]
                })

                // Always set URL
                if (!props.url || !props.url.length) {
                    props.url = window.location.href
                }

                // If Disqus has already been added, reset it
                if (typeof DISQUS !== "undefined") {
                    disqusThread.resetDisqus()
                } else { // Otherwise add Disqus to the page
                    disqusThread.copyProps(window, props, "disqus_")
                    this.addDisqusScript()
                }
            }

            this.loadDisqus()
        },

        view: function (ctrl, props) {
            return m("div", props, [
                m("#disqus_thread", [
                    m("a[href=http://disqus.com].dsq-brlink", [
                        "blog comments powered by ",
                        m("span.logo-disqus", "Disqus"),
                    ]),
                ]),
            ])
        },
    }

    var postView = {
        controller: function (post) {
            var content = this.content = m.prop()
            m.request({
                method: "GET",
                url: "./blog/" + post.url,
                deserialize: function (data) { return data },
            })
            // I don't trust that the response isn't being spoofed or
            // modified in transit. Marked does sanitize properly, though.
            .then(function (data) { return marked(data, {sanitize: true}) })
            .then(content)
            .then(function () {
                if (content()) m.redraw()
            })
        },

        view: function (ctrl, post) {
            return m(".blog-post", [
                m("h3.post-title", post.title),
                m(".post-body", [
                    ctrl.content() != null ?
                        m.trust(ctrl.content()) :
                        m(".post-loading", "Loading..."),
                ]),
            ])
        },
    }

    /**
     * The data model.
     */

    var posts = m.prop()
    var tags
    var urls = {}

    function initTags() {
        // The tags will retain the post sort, because the order doesn't change
        // with this transformation.
        tags = {}
        posts().forEach(function (post) {
            (tags[post.url] = tags[post.url] || []).push(post)
        })
    }

    function getTag(tag) {
        if (tags == null) initTags()
        return tags[tag]
    }

    /**
     * The entry point.
     */
    window.onload = function () {
        m.request({method: "GET", url: "./blog.json"})
        .then(function (data) { return data.posts })
        .then(function (data) {
            data.forEach(function (p) { p.date = new Date(p.date) })
            return data
        })
        .then(function (data) {
            // The posts should be sorted by reverse date.
            return data.sort(function (a, b) { return b.date - a.date })
        })
        .then(posts)
        .then(function () {
            // So I'm not doing an O(n) search for each blog post later.
            posts().forEach(function (post) { urls[post.url] = post })
        })
        .then(forceReload)

        function base(view) {
            return {
                view: function () {
                    return posts() ? view() : m(".blog-loading", "Loading...")
                },
            }
        }

        m.route(document.getElementById("blog"), "/", {
            "/": base(function () {
                return m(summaryView, posts())
            }),

            "/posts/:post": base(function () {
                return m(postView, urls[m.route.param("post")])
            }),

            "/tags/:tag": base(function () {
                return m(summaryView, getTag(m.route.param("tag")))
            }),
        })
    }
})()
