document.addEventListener("DOMContentLoaded", function () {
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
        if (regexp != null && e.target.type === "hidden") {
            regexp = undefined
            document.getElementById("contact-locked").classList.remove("hidden")
        }
    }

    form.onsubmit = function (e) { // eslint-disable-line max-statements
        e.preventDefault()
        e.stopPropagation()
        if (regexp == null) return
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

        var errors = document.getElementById("contact-errors")

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
            var xhr = new XMLHttpRequest()

            xhr.open("POST", "https://formspree.io/me@isiahmeadows.com")
            xhr.setRequestHeader("Accept", "application/json")
            xhr.setRequestHeader("Content-Type", "application/json")
            xhr.onreadystatechange = function (e) {
                if (this.readyState !== 4) return
                if (this.status !== 200) throw e
                location.href = "./contact-finish.html"
            }

            if (this.elements.email.value) {
                xhr.send(JSON.stringify({
                    name: this.elements.name.value,
                    _subject: "[Personal Site] " + this.elements.subject.value,
                    message: this.elements.message.value,
                    email: this.elements.email.value,
                }))
            } else {
                xhr.send(JSON.stringify({
                    name: "(Anonymous) " + this.elements.name.value,
                    _subject: "[Personal Site] " + this.elements.subject.value,
                    message: this.elements.message.value,
                }))
            }
        }
    }
})
