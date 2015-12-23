(function () {
    "use strict"

    var table = ""
    for (var i = 0; i < 10; i++) table += i
    while (i < 36) table += String.fromCharCode(55 + i++) // 65-10=55, A-Z
    while (i < 62) table += String.fromCharCode(61 + i++) // 97-36=55, A-Z

    var email = document.getElementById("email--base")
    var input = email.getElementsByTagName("input")[0]
    var text = email.getElementsByTagName("p")[0]
    var random = email.getElementsByTagName("code")[0]
    var submit = email.getElementsByTagName("button")[0]
    var wrong = email.getElementsByTagName("div")[1]

    var code

    function generate() {
        code = ""
        for (var j = 0; j < 8; j++) code += table[Math.random() * 62 | 0]
        random.innerHTML = code
    }

    generate()

    // Fool a few spam bots by making my email not appear directly in the
    // source, either. Note that this is purposefully *not* a valid email
    // address, if a spam bot finds this. And hey, it might crash a few poorly
    // written ones that try to parse this. :)
    //
    // Unobfuscated, it's `me@isiahmeadows.com`, but this comment will disappear
    // before it makes its way to the public site.
    var emailText = "@mbef@gi23#jfski^\\l2anhp\0m2r%etaud??voxwys&.*c<ozm"

    submit.onclick = function (e) {
        e = e || event
        e.preventDefault()
        e.stopPropagation()

        if (input.value === code) {
            // My email shouldn't require escaping here to display.
            var fixed = emailText.slice(1).replace(/[^\.@acdehimosw]/g, "")
            var link = document.createElement("a")
            link.innerHTML = fixed
            link.href = "mailto:" + fixed

            while (text.firstChild) text.removeChild(text.firstChild)
            text.appendChild(link)

            input.parentNode.removeChild(input)
            wrong.parentNode.removeChild(wrong)
            submit.parentNode.removeChild(submit)
            submit.onclick = undefined
            input = text = random = submit = wrong = null
        } else {
            generate()
            wrong.className = wrong.className.replace(/\bhidden\b/, "")
        }
    }
})()
