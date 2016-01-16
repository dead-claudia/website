(function () {
    "use strict"

    var table = ""
    for (var i = 0; i < 10; i++) table += i
    while (i < 36) table += String.fromCharCode(55 + i++) // 65-10=55, A-Z
    while (i < 62) table += String.fromCharCode(61 + i++) // 97-36=55, A-Z

    // Fool a few spam bots by making my email not appear directly in the
    // source, either. Note that this is purposefully *not* a valid email
    // address, if a spam bot finds this. And hey, it might crash a few poorly
    // written ones that try to parse this. :)
    //
    // Unobfuscated, it's `me@isiahmeadows.com`, but this comment will disappear
    // before it makes its way to the public site.
    var emailText = "@mbef@gi23#jfski^\\l2anhp\0m2r%etaud??voxwys&.*c<ozm"

    var code

    function generate(el) {
        code = ""
        for (var j = 0; j < 8; j++) code += table[Math.random() * 62 | 0]
        el.innerHTML = code
    }

    function getElements() {
        var email = document.getElementById("email--base")
        return {
            input: email.getElementsByTagName("input")[0],
            text: email.getElementsByTagName("p")[0],
            random: email.getElementsByTagName("code")[0],
            submit: email.getElementsByTagName("button")[0],
            wrong: email.getElementsByTagName("div")[1],
        }
    }

    function clear(el) {
        while (el.firstChild) el.removeChild(el.firstChild)
    }

    function makeFixed() {
        // My email shouldn't require escaping here to display.
        var fixed = emailText.slice(1).replace(/[^\.@acdehimosw]/g, "")
        var link = document.createElement("a")
        link.innerHTML = fixed
        link.href = "mailto:" + fixed
        return link
    }

    window.addEventListener("load", function () {
        var elements = getElements()
        generate(elements.random)

        function submit(e) {
            e.preventDefault()
            e.stopPropagation()

            if (elements.input.value === code) {
                var fixed = emailText.slice(1).replace(/[^\.@acdehimosw]/g, "")
                var link = document.createElement("a")
                link.innerHTML = fixed
                link.href = "mailto:" + fixed

                clear(elements.text)
                elements.text.appendChild(makeFixed())

                elements.input.parentNode.removeChild(elements.input)
                elements.wrong.parentNode.removeChild(elements.wrong)
                elements.submit.parentNode.removeChild(elements.submit)
                elements.submit.onclick = undefined
                elements = null
            } else {
                generate(elements.random)
                var wrong = elements.wrong
                wrong.className = wrong.className.replace(/\bhidden\b/, "")
            }
        }

        elements.input.onkeydown = function (e) {
            e = e || event
            if (e.defaultPrevented) return
            // Just in case the browser has already dropped the legacy versions
            // or doesn't support the newer version.
            if ((e.which || e.keyCode) === 13 || e.key === "Enter") {
                submit(e)
            }
        }

        elements.submit.onclick = function (e) {
            e = e || event
            if (!e.defaultPrevented) submit(e)
        }
    })
})()
