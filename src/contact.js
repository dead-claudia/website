(function () {
    "use strict"

    var got = false
    var skip = true

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
                location.href = "/contact-finish.html"
            }
        }

        if (skip) {
            console.log(out)
            setTimeout(function () {
                location.href = "/contact-finish.html"
            }, 5000)
        } else {
            xhr.send(out)
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
            return failed()
        }

        var validate = document.getElementById("validate")

        if (this.reportValidity()) {
            if (!/\bhidden\b/.test(validate.className)) {
                validate.className += " hidden"
            }

            sendRequest()
        } else {
            validate.className = validate.className.replace(/\bhidden\b/g, "")
        }
    }

    // if (location.hash === "#test") failed()
})()
