/* global emailjs: false */
(function (undefined) { // eslint-disable-line no-shadow-restricted-names
    "use strict"

    // See https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    var regexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ // eslint-disable-line max-len
    var form = document.querySelector("#contact > form")

    /*
     * Fill in some useful, informative defaults if the user clicked on
     * the website design request link.
     */
    if (/[?&]w/.test(location.search)) {
        form.elements.subject.value = "Website design request"
        // This is intentionally invalid.
        form.elements.email.value =
            "Don't forget to leave me a way to get back to you!"
    }

    form.onchange = function (e) {
        e.stopPropagation()
        if (e.target.type === "hidden") regexp = undefined
    }

    form.onsubmit = function (e) { // eslint-disable-line max-statements
        e.preventDefault()
        e.stopPropagation()
        if (!regexp) return
        var errors = document.getElementById("contact-errors")
        var lines = []

        if (/^\s*$/.test(this.elements.name.value)) {
            lines.push("A name is required, even if it's a pseudonym.")
        }

        if (this.elements.email.value &&
                !regexp.test(this.elements.email.value)) {
            lines.push("An email address must be valid if given.")
        }

        if (/^\s*$/.test(this.elements.subject.value)) {
            lines.push("A subject is required.")
        }

        if (/^\s*$/.test(this.elements.message.value)) {
            lines.push("A message is required. \"See title\" works.")
        }

        if (lines.length) {
            errors.classList.remove("hidden")
            var items = errors.querySelector("ul")

            while (items.firstChild != null) {
                items.removeChild(items.firstChild)
            }

            for (var i = 0; i < lines.length; i++) {
                var li = document.createElement("li")

                li.appendChild(document.createTextNode(lines[i]))
                items.appendChild(li)
            }
        } else {
            errors.classList.add("hidden")
            regexp = undefined
            var response = {
                subject: "[Personal Site] " + this.elements.subject.value,
                name: this.elements.name.value,
                message: this.elements.message.value,
                email: this.elements.email.value,
            }

            if (!response.email) {
                response.name = "(Anonymous) " + response.name
                response.email = undefined
            }

            emailjs.send(
                "self", "isiahmeadows_com_contact", response,
                "user_FWKdESFC9w9HMvxpesbV5"
            ).then(function () { location.href = "finish.html" })
        }
    }
})()
