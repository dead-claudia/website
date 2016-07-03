/* global m */

(function () {
    "use strict"

    var undefined // eslint-disable-line no-shadow-restricted-names

    // See https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ // eslint-disable-line max-len

    var messages = {
        name: "A name is required, even if it's a pseudonym.",
        email: "An email address must be valid if given.",
        subject: "A subject is required. \"No subject\" is okay.",
        message: "A message is required. \"See title\" works.",
    }

    var control = {
        view: function (_, attrs, text) {
            return m("label", [
                m("span", {class: attrs.required ? "required" : ""}, text),
                m("input", attrs),
            ])
        },
    }

    m.mount(document.getElementById("contact"), {
        controller: function () {
            this.locked = m.prop(false)
            this.name = m.prop("")
            this.email = m.prop("")
            this.subject = m.prop("")
            this.message = m.prop("")
            this.errors = m.prop()

            /*
             * Fill in some useful, informative defaults if the user clicked on
             * the website design request link.
             */
            if (/[?&]w/.test(location.search)) {
                this.subject("Website design request")
                // This is intentionally invalid.
                this.email("Don't forget to leave me a way to get back to you!")
            }

            this.onsubmit = function (e) {
                e = e || event
                e.preventDefault()
                e.stopPropagation()

                if (this.locked()) return

                var lines = []

                if (/^\s*$/.test(this.name())) lines.push(messages.name)

                if (this.email() !== "" && !emailRegex.test(this.email())) {
                    lines.push(messages.email)
                }

                if (/^\s*$/.test(this.subject())) lines.push(messages.subject)
                if (/^\s*$/.test(this.message())) lines.push(messages.message)

                if (lines.length) {
                    this.errors(lines)
                    return
                }

                this.errors(undefined)
                if (!this.email()) this.name("(Anonymous) " + this.name())

                // TODO: create Heroku dyno to POST email json to.
                m.request({
                    method: "POST",
                    url: "//formspree.io/me@isiahmeadows.com",
                    config: function (xhr) {
                        xhr.setRequestHeader("Accept", "application/json")
                        xhr.setRequestHeader("Content-Type",
                            "application/x-www-form-urlencoded")
                    },
                    data: m.route.buildQueryString({
                        name: this.name(),
                        _subject: "[Personal Site] " + this.subject(),
                        message: this.message(),
                        email: this.email() || undefined,
                    }),
                })
                .then(function () { location.href = "./contact-finish.html" })
            }
        },

        view: function (ctrl) {
            return m("form", {
                novalidate: "",
                onchange: function (e) { ctrl[e.target.name](e.target.value) },
                onsubmit: ctrl.onsubmit.bind(ctrl),
            }, [
                m("div", [
                    m("p", m("span.required"), " = Required"),

                    m(control, {
                        name: "name",
                        required: "required",
                        autocomplete: "name",
                    }, "Name:"),

                    m(control, {
                        name: "email",
                        type: "email",
                        autocomplete: "email",
                    }, "Email:"),

                    m(control, {
                        name: "subject",
                        required: "required",
                        autocomplete: "off",
                    }, "Subject:"),

                    m("label.msg", [
                        m("span.required", "Message"),
                        m("textarea", {
                            autocomplete: "off",
                            required: "required",
                            name: "message",
                        }),
                    ]),

                    m("input[type=hidden]", {
                        onchange: ctrl.locked.bind(ctrl, true),
                    }),

                    !ctrl.errors() ? null : m(".warning", [
                        m("p", [
                            "Could you fix these problems for me before ",
                            "submitting this form?",
                        ]),
                        m("ul", ctrl.errors().map(function (error) {
                            return m("li", error)
                        })),
                    ]),

                    m(".submit", [
                        m("input[type=submit][value=Send]"),
                    ]),

                    !ctrl.locked() ? null : m(".warning", [
                        "Hidden field modified. Form locked. (If you are a ",
                        "human, you might want to be careful messing with the ",
                        "source code ",
                        m("img.wink[src=wink.png][alt='winking face']"),
                        ". And while you are at it, you can always reload the ",
                        "page.)",
                    ]),
                ]),
                m("small", [
                    "Legal note: By submitting this form, you agree that it ",
                    "is not confidential, as I cannot guarantee any 100% ",
                    "safety or privacy through the Internet. Even end-to-end ",
                    "HTTPS through ",
                    m("a[target=_blank][href=https://torproject.org]", "Tor"),
                    " and a VPN can't legally guarantee you that.",
                    m("img.wink[src=wink.png][alt='winking face']"),
                ]),
            ])
        },
    })
})()
