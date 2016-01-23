(function () {
    "use strict"

    var got = false
    var skip = true

    // See https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    /* eslint-disable max-len */
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    /* eslint-enable max-len */

    // Fool a few spam bots by making my email not appear directly in the
    // source, either. Note that this is purposefully *not* a valid email
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

        var out =
            "name=" + encodeURIComponent(name) +
            "&_subject=" + encodeURIComponent("[Personal Site] " + subject) +
            "&message=" + encodeURIComponent(message)

        if (email) out += "&email=" + encodeURIComponent(email)

        // TODO: create Heroku dyno to POST email json to.
        var xhr = new XMLHttpRequest()
        xhr.open("POST", "//formspree.io/" + fixed)
        xhr.setRequestHeader("Accept", "application/json")
        xhr.setRequestHeader("Content-Type",
            "application/x-www-form-urlencoded")

        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                location.href = "./contact-finish.html"
            }
        }

        if (skip) {
            console.log(out)
            setTimeout(function () {
                location.href = "./contact-finish.html"
            }, 5000)
        } else {
            xhr.send(out)
        }
    }

    function verifyExists(lines, id, message) {
        if (/^\s*$/.test(document.getElementById(id).value)) {
            lines.push(message)
        }
    }

    function verifyEmail(lines) {
        var email = document.getElementById("email").value

        if (email !== "" && !emailRegex.test(email)) {
            lines.push("If you want to give me an email address, it needs to " +
                "be a valid one.")
        }
    }

    function verifyAndSend() {
        var lines = []

        verifyExists(lines, "name", "A name is required, even if it's a " +
            "pseudonym. I'd like to know who to call you!")

        verifyEmail(lines)

        verifyExists(lines, "subject", "A subject is required. Helps with " +
            "sifting through emails.")

        verifyExists(lines, "message", "A message is required. Even if the " +
            "title is the message, I'd prefer that to be explicit.")

        var errors = document.getElementById("errors")

        if (lines.length) {
            var text = "<p>Could you fix these problems for me before " +
                "submitting this form?</p><ul>"

            for (var i = 0; i < lines.length; i++) {
                text += "<li>" + lines[i] + "</li>"
            }

            errors.innerHTML = text + "</ul>"
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
})()
