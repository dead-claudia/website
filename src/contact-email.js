/* global m */

(function () {
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

    function getFixed() {
        return emailText.slice(1).replace(/[^\.@acdehimosw]/g, "")
    }

    m.mount(document.getElementById("email--base"), {
        controller: function () {
            this.reveal = false
            this.code = generate()
            this.value = m.prop("")
            this.email = null
            this.fail = false

            var self = this

            function check() {
                if (self.value() === self.code) {
                    self.email = getFixed()
                    self.reveal = true
                } else {
                    self.code = generate()
                    self.fail = true
                }
            }

            this.onsubmit = function (e) {
                e = e || event
                e.preventDefault()
                e.stopPropagation()
                check()
            }
        },

        view: function (ctrl) {
            if (ctrl.reveal) {
                return m("div", [
                    m("p", m("a", {href: "mailto:" + ctrl.email}, ctrl.email)),
                ])
            }

            return m("form", {onsubmit: ctrl.onsubmit}, [
                m("p.text", [
                    "(Trying to limit spammers. Type or copy code to see my " +
                        "email: ",
                    m("span", ctrl.code), ")",
                ]),
                m("input.input", {
                    onchange: m.withAttr("value", ctrl.value),
                    value: ctrl.value(),
                }),
                m("button.submit", "Submit"),
                ctrl.fail
                    ? m(".wrong",
                        "Wrong code. Please try again. Do note that it's " +
                        "case-sensitive.")
                    : null,
            ])
        },
    })
})()
