(function (document, wrapper) {
    "use strict"

    // Set of the 62 alpha-numeric characters, as a string
    var table = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

    // Fool a few spam bots by making my email not appear directly in the
    // source, either. Note that this is purposefully *not* a valid email
    // address, if a spam bot finds this. And hey, it might crash a few poorly
    // written ones that try to parse this. :)
    //
    // Unobfuscated, it's `me@isiahmeadows.com`, but this comment will disappear
    // before it makes its way to the public site.
    var emailText = "@mbef@gi23#jfski^\\l2anhp\0m2r%etaud??voxwys&.*c<ozm"

    function generate() {
        var code = ""

        for (var j = 0; j < 8; j++) {
            code += table.charAt(Math.random() * 62 | 0)
        }

        return code
    }

    function n(type, attrs, children) {
        var elem = document.createElement(type)

        for (var attr in attrs) {
            if ({}.hasOwnProperty.call(attrs, attr)) {
                elem[attr] = attrs[attr]
            }
        }

        (function append(e) {
            if (Array.isArray(e)) {
                e.forEach(append)
            } else if (e != null) {
                elem.appendChild(
                    typeof e === "string" ? document.createTextNode(e) : e)
            }
        })(children)

        return elem
    }

    var input, wrong, random

    while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild)

    // The content is generated via JavaScript, for progressive enhancement.
    wrapper.appendChild(n("div", null, [
        n("p", {className: "text"}, [
            "(Trying to limit spammers. Type or copy code to see my email: ",
            random = n("span", {textContent: generate()}), ")",
        ]),
        input = n("input", {
            className: "input",
            onkeydown: function (e) {
                e = e || event
                if (e.defaultPrevented) return
                // Just in case the browser has already dropped the legacy
                // versions or doesn't support the newer version.
                if ((e.which || e.keyCode) === 13 || e.key === "Enter") {
                    check(e)
                }
            },
        }),
        n("button", {
            className: "submit",
            onclick: function (e) {
                e = e || event
                if (!e.defaultPrevented) check(e)
            },
        }, "Submit"),
        wrong = n("div", {className: "wrong hidden"}, [
            "Wrong code. Please try again. Do note that it's case-sensitive.",
        ]),
    ]))

    function check(e) {
        e.preventDefault()
        e.stopPropagation()

        if (input.value === random.textContent) {
            var fixed = emailText.slice(1).replace(/[^\.@acdehimosw]/g, "")

            while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild)
            wrapper.appendChild(n("div", null, [
                n("p", null, n("a", {href: "mailto:" + fixed}, fixed)),
            ]))
        } else {
            random.textContent = generate()
            wrong.className = wrong.className.replace(/\bhidden\b/, "")
        }
    }
})(document, document.getElementById("email--base"))
