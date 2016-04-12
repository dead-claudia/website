/* global m */

(function () {
    "use strict"

    var got = false

    // See https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ // eslint-disable-line max-len

    // Fool a few spam bots (hopefully) by making my email not appear directly
    // in the source, either. Note that this is purposefully *not* a valid email
    // address, if a spam bot finds this. And hey, it might crash a few poorly
    // written ones that try to parse this. :)
    //
    // Unobfuscated, it's `me@isiahmeadows.com`, but this comment will disappear
    // before it makes its way to the public site.
    var emailText = "@mbef@gi23#jfski^\\l2anhp\0m2r%etaud??voxwys&.*c<ozm"

    function failed() {
        document.getElementById("submit").className += " hidden"
        var div = document.getElementById("gotcha-message")

        div.className = div.className.replace(/\bhidden\b/g, "")
    }

    function sendRequest() {
        // My email shouldn't require escaping here to display.
        var fixed = emailText.slice(1).replace(/[^\.@acdehimosw]/g, "")
        var name = document.getElementById("name").value
        var email = document.getElementById("email").value
        var subject = document.getElementById("subject").value
        var message = document.getElementById("message").value

        if (!email) name = "(Anonymous) " + name

        // TODO: create Heroku dyno to POST email json to.
        m.request({
            method: "POST",
            url: "//formspree.io/" + fixed,
            config: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json")
                xhr.setRequestHeader("Content-Type",
                    "application/x-www-form-urlencoded")
            },
            data: m.route.buildQueryString({
                name: name,
                _subject: "[Personal Site] " + subject,
                message: message,
                email: email || undefined,
            }),
        })
        .then(function () { location.href = "./contact-finish.html" })
    }

    var messages = {
        name: "A name is required, even if it's a pseudonym.",
        email: "An email address must be valid if given.",
        subject: "A subject is required. \"No subject\" is okay.",
        message: "A message is required. \"See title\" works.",
    }

    function verifyAndSend() {
        var lines = []

        function verifyExists(id) {
            if (/^\s*$/.test(document.getElementById(id).value)) {
                lines.push(messages[id])
            }
        }

        verifyExists("name")

        var email = document.getElementById("email").value

        if (email !== "" && !emailRegex.test(email)) {
            lines.push(messages.email)
        }

        verifyExists("subject")
        verifyExists("message")

        var errors = document.getElementById("errors")

        if (lines.length) {
            errors.innerHTML =
                "<p>Could you fix these problems for me before submitting " +
                "this form?</p><ul><li>" + lines.join("</li><li>") +
                "</li></ul>"
            errors.className = errors.className.replace(/\bhidden\b/g, "")
        } else {
            if (!/\bhidden\b/.test(errors.className)) {
                errors.className += " hidden"
            }

            sendRequest()
        }
    }

    var contact = document.getElementById("contact")

    contact.reset()
    contact.onsubmit = function (e) {
        e = e || event
        e.preventDefault()
        e.stopPropagation()

        // Don't repeat the same steps if the form was locked.
        if (got) return

        if (document.getElementById("gotcha").value) {
            failed()
        } else {
            verifyAndSend()
        }
    }

    if (/[?&]w/.test(window.location.search)) {
        document.getElementById("subject").value = "Website design request"
        // This is intentionally invalid.
        document.getElementById("email").value =
            "Don't forget to leave me a way to get back to you!"
    }
})()
