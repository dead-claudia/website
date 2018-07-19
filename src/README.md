## My website's source

These are all the client files. And a simple guide to my code structure:

- images/

  The various images of the site.

- mixins/

  These are merely helper files that don't make it to the public site. If it's not meant to be a page or user-loaded stylesheet, it's not loaded. Except for the global styles, any of the mixins have their stylesheet also named this way.

- mixins/page.pug, page.styl

  These are the general templates for all the pages on this site. It made consistency magically easy to accomplish, while also automagically marking the current selected page in the header as a class as well as filling everything else. The page.styl file is loaded globally purely to benefit from caching, as it contains more CSS than even the blog.

- mixins/common.styl

  These contain most of the global color scheme for the site. Better to have this properly isolated from the rest of the site.

- mixins/highlight-style.styl

  This contains the stylesheet for code run through [Highlight.js][hljs].

- *page-name*.pug, *page-name*.styl, *page-name*.js

  The rest of the site is separated into components like these. Not all pages have all of these (e.g. most do not use a single line of JavaScript apart from tracking), but this is merely for consistency and ease of knowing where to look when problems come up.

[hljs]: https://highlightjs.org/
