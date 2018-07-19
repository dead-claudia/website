/* global gtag: false */
(function () {
    "use strict"

    function addClass(selector, className) {
        var elems = document.querySelectorAll(selector)

        for (var i = 0; i < elems.length; i++) {
            elems[i].classList.add(className)
        }
    }

    function removeClass(selector, className) {
        var elems = document.querySelectorAll(selector)

        for (var i = 0; i < elems.length; i++) {
            elems[i].classList.remove(className)
        }
    }

    /**
     * Eventually, this needs to be paginated, but I don't see that being a
     * problem in the near term.
     */
    var auto = decodeURIComponent(location.hash.slice(1))
    var prev = location.hash.length <= 1
    var lastUpdate

    // Debounce the update, so we aren't spamming the DOM with changes.
    document.querySelector(".tag-search").onkeydown = function (e) {
        if (lastUpdate) clearTimeout(lastUpdate)
        lastUpdate = setTimeout(function () {
            auto = e.target.value
            location.hash = "#" + encodeURIComponent(auto)
        }, 400)
    }

    document.querySelector(".tag-search input").removeAttribute("disabled")
    document.querySelector(".tag-search input").value = auto
    document.querySelector(".tag-search").classList.remove("disabled")
    document.querySelector(".tag-search label").textContent = "Search by tag:"

    function setTitle(title) {
        var tagTitle = document.querySelector(".tag-title")

        if (tagTitle.textContent !== title) tagTitle.textContent = title
    }

    // eslint-disable-next-line max-statements
    window.onhashchange = function () {
        var currentTag = decodeURIComponent(location.hash.slice(1))

        if (!currentTag !== prev) {
            if (currentTag) {
                // Don't crash if Google Analytics doesn't load
                try {
                    // eslint-disable-next-line camelcase
                    gtag("event", "search", {search_term: currentTag})
                } catch (_) {
                    // ignore
                }
            }
            prev = !currentTag
        }

        if (currentTag !== auto) scrollTo(0, 0)

        if (currentTag && /^[\w ,-]+$/.test(currentTag)) {
            var tags = currentTag.trim().toLowerCase().split(/\s*,\s*/g)
            var tagFilters = ""
            var tagRejects = ".post-tag.post-tag-active"
            var entryFilters = ""
            var entryRejects = ".blog-entry"

            // This would be *way* shorter if I could use an `:any()` selector
            // list.
            for (var i = 0; i < tags.length; i++) {
                // Escape CSS attribute
                var escaped = "'" + tags[i].replace(/[\\']/g, "\\$&") + "'"

                tagFilters +=
                    ".post-tag:not(.post-tag-active)[data-tag*=" + escaped +
                    "], "
                tagRejects += ":not([data-tag*=" + escaped + "])"

                entryFilters += ".blog-entry[data-tags*=" + escaped + "], "
                entryRejects += ":not([data-tags*=" + escaped + "])"
            }

            addClass(tagFilters.slice(0, -2), "post-tag-active")
            removeClass(tagRejects, "post-tag-active")
            removeClass(entryFilters.slice(0, -2), "hidden")
            addClass(entryRejects, "hidden")

            var count = document.querySelectorAll(
                ".blog-entry:not(.hidden)"
            ).length
            var list

            if (tags.length === 1) {
                list = "'" + tags[0] + "'"
            } else if (tags.length === 2) {
                list = "'" + tags[0] + "' or '" + tags[1] + "'"
            } else {
                var last = tags.pop()

                list = ""
                for (var j = 0; j < tags.length; j++) {
                    list += "'" + tags[j] + "', "
                }

                list += "or '" + last + "'"
            }

            addClass(".blog-summary.warning", "hidden")
            setTitle(
                "Posts with tags containing " + list + " (" + count + " post" +
                (count === 1 ? "" : "s") + "):"
            )
        } else {
            removeClass(".post-tag.post-tag-active", "post-tag-active")
            removeClass(".blog-entry.hidden", "hidden")

            if (currentTag) {
                removeClass(".blog-summary.warning", "hidden")
                setTitle("Invalid tag: '" + currentTag + "'")
            } else {
                addClass(".blog-summary.warning", "hidden")
                setTitle("Posts, sorted by most recent.")
            }
        }
    }

    window.onhashchange()
})()
