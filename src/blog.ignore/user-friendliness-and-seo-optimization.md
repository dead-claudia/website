---
title: >-
    User friendliness and SEO optimization for clients without JS using
    <noscript>, <meta>
date: 2014-05-27
tags:
    - html
    - javascript
    - accessibility
---

*Edit (2016-01-14): correct the last paragraph, as IE6+ can still parse HTML5,
albeit not display it properly without shims.*

---

The following is a simple HTML hack to really help with detecting clients
without JavaScript enabled or supported and serve them better content
accordingly:

In the `<head>`, add this code:

```html
<noscript>
    <meta http-equiv="refresh" content="0; url=www.example.com/no-js-version">
</noscript>
```

The URL can be any of your choosing, and it matters none what it is. It is just
meant to point to a version that does not require JavaScript. This is best
placed as the first tag after the `<meta charset="utf-8">` in the `<head>`.

There is a caveat to this: it only validates as HTML5. This means nothing to
modern browsers, but it could provide potential issues if you need to validate
this as HTML 4 for older browsers (e.g. IE8 or earlier).
