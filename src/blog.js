/* global marked: false, hljs: false */

(function (undefined) { // eslint-disable-line max-statements, no-shadow-restricted-names, max-len
    "use strict"

    // Wrapper to not crash if Google Analytics doesn't load, with added feature
    // of avoiding logging on demand.
    var noGA = false

    function ga() {
        if (noGA) return
        try {
            window.ga.apply(undefined, arguments)
        } catch (_) {
            // ignore
        }
    }

    // Super simple HTML sanitizer
    function sanitize(str) {
        return str.replace(/&<"/g, function (m) {
            if (m === "&") return "&amp;"
            if (m === "<") return "&lt;"
            return "&quot;"
        })
    }

    var markedOpts = {
        // I don't trust that the response isn't being spoofed or
        // modified in transit. Marked does sanitize properly, though.
        sanitize: true,
        langPrefix: "hljs hljs-",
        renderer: new marked.Renderer(),
        // The highlighter isn't loaded until later.
        highlight: function (code, lang) {
            return hljs.highlight(lang, code).value
        },
    }

    /**
     * Make Marked support specifying image size in pixels in this format:
     *
     * ![alt](href = x WIDTH "title")
     * ![alt](href = HEIGHT x "title")
     * ![alt](href = HEIGHT x WIDTH "title")
     *
     * Note: whitespace from the equals sign to the title/end of image is
     * all optional. Each of the above examples are equivalent to these
     * below, respectively:
     *
     * ![alt](href =xWIDTH "title")
     * ![alt](href =HEIGHTx "title")
     * ![alt](href =HEIGHTxWIDTH "title")
     *
     * Example usage:
     *
     * ![my image](https://example.com/my-image.png =400x600 "My image")
     */
    markedOpts.renderer.image = function (href, title, alt) {
        var exec = /\s=\s*(\d*%?)\s*x\s*(\d*%?)\s*$/.exec(href)

        if (exec) href = href.slice(0, -exec[0].length)
        var res = '<img src="' + sanitize(href) + '" alt="' + sanitize(alt)

        if (title) res += '" title="' + sanitize(title)
        if (exec && exec[1]) res += '" height="' + exec[1]
        if (exec && exec[2]) res += '" width="' + exec[2]
        return res + '">'
    }

    /**
     * The (barely-existing) data model. A quick explanation:
     *
     * posts: The list of blog posts, with only metadata, but sorted by date.
     * This is defined in the generated `blog-posts.js`.
     *
     * urls: A mapping of post url -> post. This is purely for resolving the URL
     * to a post without having to search the entirety of posts. It may be
     * currently insignificant, but that may change later on as I write more
     * blog posts.
     *
     * tags: A mapping of tag -> post. Note that it references the post
     * directly, not the index. Also, all matches are case-insensitive.
     *
     * inst: The current instance, in case it needs used non-locally.
     *
     * getTag(): Gets a list of posts from one or more comma-separated tags. If
     * either the tag isn't valid or no posts have that tag, then it returns an
     * empty list. Eventually, I might restructure the code to not be so bound
     * to the route parameter, and have validation happen only once.
     */

    function validateTag(tag) {
        return !tag || /^[\w ,\-]+$/.test(tag)
    }

    var urls = Object.create(null)
    var tags = Object.create(null)

    function initTags() {
        tags = Object.create(null)

        for (var i = 0; i < window.posts.length; i++) {
            var post = window.posts[i]

            for (var j = 0; j < post.tags.length; j++) {
                var name = post.tags[j].toLowerCase()
                var list = tags[name]

                if (!list) {
                    list = tags[name] = [post]
                    list.link = document.createElement("a")
                    list.link.classList.add("post-tag")
                    list.link.textContent = name
                } else if (list.indexOf(post) < 0) {
                    list.push(post)
                }
            }
        }
    }

    function getTag(tag) {
        var ret = []
        var tagList = tag.toLowerCase().split(/\s*,\s*/g)
        var cache = Object.create(null)

        if (tags == null) initTags()

        // Remove the duplicates. The URL is the key for the posts, since those
        // are unique.
        for (var i = 0; i < tagList.length; i++) {
            var list = tags[tagList[i]]

            if (list != null) {
                for (var j = 0; j < list.length; j++) {
                    var post = list[j]

                    if (!cache[post.url]) {
                        cache[post.url] = true
                        ret.push(post)
                    }
                }
            }
        }

        return ret
    }

    function formatList(tagStr, posts) {
        var tags = tagStr.split(/\s*,\s*/g)
        var count = posts.length
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

        return "Posts tagged " + list + " (" + count + " post" +
            (count === 1 ? "" : "s") + "):"
    }

    /**
     * The views.
     */

    var root

    function clear(node) {
        while (node.firstChild) node.removeChild(node.firstChild)
    }

    function fillText(elem, selector, value) {
        elem.querySelector(selector).textContent = value
    }

    /**
     * The combined summary and tag search. The two views are only different in
     * the posts they display and the presence of a back button, not the format
     * they're displayed in.
     *
     * Eventually, this needs to be paginated, but I don't see that being a
     * problem in the near term.
     */
    var summaryPage, summaryBack, summaryTagTitle, summaryWarning
    var summaryBlogList

    function blogSummaryInit() {
        if (summaryPage == null) {
            var template = document.getElementById("blog-summary")

            summaryPage = template.content.cloneNode(true).firstChild
            summaryBack = summaryPage.querySelector(".back")
            summaryTagTitle = summaryPage.querySelector(".tag-title")
            summaryWarning = summaryPage.querySelector(".warning")
            summaryBlogList = summaryPage.querySelector(".blog-list")

            summaryPage.addEventListener("click", summaryHandleEvent, false)
            summaryPage.addEventListener("keydown", summaryHandleEvent, false)
        }

        clear(root)
        root.appendChild(summaryPage)
        summaryListInit(window.posts)
    }

    function summaryListInit(posts, currentTag) {
        clear(summaryBlogList)
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i]
            var template = document.getElementById("blog-entry")
            var entry = template.content.cloneNode(true).firstChild

            summaryBlogList.appendChild(entry)
            entry.href = "#/posts/" + post.url
            fillText(entry, ".post-date",
                post.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }))
            fillText(entry, ".post-title", post.title)
            fillText(entry, ".post-preview", post.preview)

            var postTags = entry.querySelector(".post-tags")

            for (var j = 0; j < post.tags.length; j++) {
                var tag = post.tags[j]
                // These could be duplicated.
                var link = tags[tag].link.cloneNode(true)

                postTags.appendChild(link)
                if (tag === currentTag) link.classList.add("post-tag-active")
                else link.classList.remove("post-tag-active")
            }
        }
    }

    function summarySearch(tag) {
        ga("send", "pageview", "/tags/")
        summaryBack.classList.remove("hidden")
        // The header for the tag view requires a little more logic to
        // correctly display the list.
        var resolved = tag.toLowerCase()
        var posts

        if (!validateTag(resolved)) {
            posts = []
            summaryWarning.classList.remove("hidden")
            summaryTagTitle.textContent = "Invalid tag: '" + tag + "'"
        } else {
            posts = getTag(resolved)
            summaryWarning.classList.add("hidden")
            summaryTagTitle.textContent = formatList(resolved, posts)
        }

        summaryListInit(posts, resolved)
    }

    function summaryHandleEvent(e) {
        var elem = e.target

        // Only capture clicks to tags and `back`
        if (e.type === "click" && (
            elem.classList.contains("post-tag") ||
            elem.classList.contains("back")
        )) {
            e.preventDefault()
            e.stopPropagation()

            if (elem.classList.contains("post-tag")) {
                // The inner text has the tag name
                summarySearch(elem.textContent)
            } else {
                // Going back from the search
                elem.classList.add("hidden")
                summaryTagTitle.textContent = "Posts, sorted by most recent."
                summaryPage.querySelector(".tag-search input").value = ""
                summaryListInit(window.posts)
            }
        } else if ((e.which || e.keyCode) === 13 || e.key === "Enter") {
            // Just in case the browser has already dropped the legacy
            // versions or doesn't support the newer version.
            e.preventDefault()
            e.stopPropagation()
            var tag = elem.value

            if (validateTag(tag)) {
                summaryWarning.classList.remove("hidden")
                summarySearch(tag)
            } else {
                summaryWarning.classList.add("hidden")
            }
        }
    }

    /**
     * Displays a post from a remotely stored Markdown file, with associated
     * metadata already retrieved from ./blog.json.
     */
    var postPage, postBody, postTags

    function postInit(post) { // eslint-disable-line max-statements
        if (postPage == null) {
            var template = document.getElementById("blog-post")

            postPage = template.content.cloneNode(true).firstChild
            postBody = postPage.querySelector(".post-body")
            postTags = postPage.querySelector(".post-tags")

            postPage.addEventListener("click", postHandleEvent, false)
        }

        clear(root)
        clear(postBody)
        fillText(postPage, ".post-title", post.title)
        var loading = document.createElement("p")

        postBody.appendChild(loading)
        loading.textContent = "Loading..."
        root.appendChild(postPage)
        var xhr = new XMLHttpRequest()

        // Return the literal data as a string. It's markdown, not JSON.
        xhr.open("GET", "blog/" + post.url)
        xhr.setRequestHeader("Content-Type", "text/markdown")
        xhr.setRequestHeader("Accept", "text/markdown")
        xhr.addEventListener("load", postHandleEvent, false)
        xhr.send()
        var first = postTags.firstChild

        while (first.nextChild) postTags.removeChild(first.nextChild)
        for (var i = 0; i < post.tags.length; i++) {
            var elem = tags[post.tags[i]].link

            elem.classList.remove("post-tag-active")
            postTags.appendChild(elem)
        }
    }

    function postHandleEvent(e) {
        var elem = e.target

        if (e.type === "load") {
            // handle XHR load
            postBody.innerHTML = marked(elem.responseText, markedOpts)
        } else if (elem.classList.contains("post-tag")) {
            // Only capture clicks to tags and `back`
            e.preventDefault()
            e.stopPropagation()
            noGA = true
            location.hash = "#/"
            noGA = false
            summarySearch(elem.textContent)
        }
    }

    /**
     * The entry point.
     */

    // Initialize the tag database and format the posts to make more sense.
    // May need to redo this in the future as more posts enter the picture.
    for (var i = 0; i < window.posts.length; i++) {
        var post = window.posts[i]

        // Parse each date as an actual Date instance.
        post.date = new Date(post.date)

        // So I'm not doing an O(n) search for each blog post later.
        urls[post.url] = post

        for (var j = 0; j < post.tags.length; j++) {
            var name = post.tags[j].toLowerCase()
            var list = tags[name]

            if (!list) {
                list = tags[name] = [post]
                list.link = document.createElement("a")
                list.link.classList.add("post-tag")
                list.link.textContent = name
            } else if (list.indexOf(post) < 0) {
                list.push(post)
            }
        }
    }

    window.render = function () {
        if (!("content" in document.createElement("template"))) {
            var templates = document.getElementsByTagName("template")

            for (var k = 0; k < templates.length; k++) {
                var template = templates[k]

                template.content = document.createDocumentFragment()
                while (template.firstChild) {
                    template.content.appendChild(template.firstChild)
                }
            }
        }

        window.onhashchange()
    }

    window.onhashchange = function () {
        if (!root) root = document.getElementById("blog")
        else scrollTo(0, 0)
        var route = location.hash.slice(1)

        if (route.slice(0, 7) === "/posts/") {
            var postUrl = decodeURIComponent(route.slice(7))

            if (urls[postUrl] != null) {
                if (summaryPage != null) {
                    summaryPage.querySelector(".tag-search input").value = ""
                }
                ga("send", "pageview", route)
                postInit(urls[postUrl])
                return
            }
        }

        ga("send", "pageview", "/")
        blogSummaryInit()
    }
})()
