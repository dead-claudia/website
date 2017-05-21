/* global m */

(function (undefined) { // eslint-disable-line no-shadow-restricted-names
    "use strict"

    // See https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ // eslint-disable-line max-len

    var errorName = "A name is required, even if it's a pseudonym."
    var errorEmail = "An email address must be valid if given."
    var errorSubject = "A subject is required. \"No subject\" is okay."
    var errorMessage = "A message is required. \"See title\" works."

    var form = {
        name: "",
        email: "",
        subject: "",
        message: "",
    }

    var locked = false
    var errors

    /*
     * Fill in some useful, informative defaults if the user clicked on
     * the website design request link.
     */
    if (/[?&]w/.test(location.search)) {
        form.subject = "Website design request"
        // This is intentionally invalid.
        form.email = "Don't forget to leave me a way to get back to you!"
    }

    function submit(e) {
        e = e || event
        e.preventDefault()
        e.stopPropagation()

        if (locked) return

        var lines = []

        if (/^\s*$/.test(form.name)) lines.push(errorName)
        if (form.email && !emailRegex.test(form.email)) lines.push(errorEmail)
        if (/^\s*$/.test(form.subject)) lines.push(errorSubject)
        if (/^\s*$/.test(form.message)) lines.push(errorMessage)

        if (lines.length) {
            errors = lines
        } else {
            errors = undefined
            if (!form.email) form.name = "(Anonymous) " + form.name

            m.request("//formspree.io/me@isiahmeadows.com", {
                method: "POST",
                background: true,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                serialize: m.buildQueryString,
                data: {
                    name: name,
                    _subject: "[Personal Site] " + form.subject,
                    message: form.message,
                    email: form.email || undefined,
                },
            })
            .then(function () { location.href = "./contact-finish.html" })
        }
    }

    m.mount(document.getElementById("contact"), {
        view: function () {
            return m("form[novalidate=]", {
                onchange: function (e) { form[e.target.name] = e.target.value },
                onsubmit: submit,
            }, [
                m("div", [
                    m("p", m("span.required"), " = Required"),

                    m("label", [
                        m("span.required", "Name:"),
                        m("input[name=name][required][autocomplete=name]"),
                    ]),

                    m("label", [
                        m("span", "Email:"),
                        m("input[name=email][type=email][autocomplete=email]"),
                    ]),

                    m("label", [
                        m("span.required", "Subject:"),
                        m("input[name=subject][required][autocomplete=off]"),
                    ]),

                    m("label.msg", [
                        m("span.required", "Message"),
                        m("textarea", {
                            autocomplete: "off",
                            required: "required",
                            name: "message",
                        }),
                    ]),

                    m("input[type=hidden]", {
                        onchange: function () { locked = true },
                    }),

                    !errors ? null : m(".warning", [
                        m("p", [
                            "Could you fix these problems for me before ",
                            "submitting this form?",
                        ]),
                        m("ul", errors.map(function (error) {
                            return m("li", error)
                        })),
                    ]),

                    m(".submit", [
                        m("input[type=submit][value=Send]"),
                    ]),

                    !locked ? null : m(".warning", [
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
