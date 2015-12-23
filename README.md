# My personal website

This is probably uninteresting to you unless you want to see the source code of
my personal website. And if you do, you're looking at a giant work in progress.
Nothing too interesting.

## Building

You need at least [Node.js v4] to build this. And although this *may* build on
Windows or OSX (I'm running Linux), since I have made efforts to try to make
the build system work there, I can't guarantee anything.

- `node make clean` - Clean dist/

## Description of files:

  - src/

    Where all the client files are. This includes Jade, CSS, and JS files.

  - dist/

    Where all the auto-generated files are.

  - dist-base/

    A template for dist/

  - make.js

    Built off of my homegrown build system, an experiment with a truly
    concurrent JS build system, not merely asynchronous like Gulp or Grunt. And
    this isn't exactly a massive website written in 10 different languages, so
    that simplifies the matter.

  - server.js

    A simple dev server. Easy to use, and works for the job. It took a fraction
    of the time it would normally take for most of the premade solutions.

  - scripts/

    Helper files for make.js and server.js.

## Technologies:

  - Jade, for preprocessing HTML.

  - PostCSS + Autoprefixer, for automatically adding prefixes to things.

  - Express + a few related middlewares, for a simple development server that
    "just works" without extra annoying configuration (it's under 40 lines)

  - HTML Minifier + clean-css + UglifyJS for minifying the files before they go
    into the wild, where people don't need to download pretty source code to
    view pretty content. :wink:

  - A [custom build system](https://github.com/isiahmeadows/website/blob/master/make.js)
    for this thing, because I don't need anything truly complicated, it wasn't
    hard to write, and it's faster than everything else out there. (I don't know
    of very many truly concurrent build systems out there, especially in JS.)

  - GitHub Pages, to host this thing.

## License/Copyrights

&copy; 2015 Isiah Meadows. Some Rights Reserved.

All content and source code in this website are dual-licensed under the
[CC-BY 4.0 International](https://creativecommons.org/licenses/by/4.0/) and the
[ISC License](https://opensource.org/licenses/ISC), unless otherwise stated.
Both of these licenses may be viewed in the
[LICENSE](https://github.com/isiahmeadows/website/blob/master/LICENSE) file.

*One example includes my music, in which many of the older songs are under the
CC-BY-SA or CC-BY-NC licenses. I am trying my best to keep everything straight
here in that.*
