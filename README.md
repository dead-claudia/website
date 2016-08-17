# My personal website

This is probably uninteresting to you unless you want to see the source code of my personal website. And if you do, you're looking at a giant, perpetual work in progress. Nothing too interesting.

Things I still have left to do:

- Update Jade to Pug.

- Make a Heroku server to deal with AJAX-based email better.

- Make the blog more scalable (hundreds of posts should *just work*, and be paginated). Low priority until I actually have a lot of posts.

## Building

You need at least [Node.js v4.0][node] to build this. And although this *might* build on Windows or OS X (I'm running Linux), since I have made efforts to try to make the build system work there, I can't guarantee anything.

First, before you run *anything*, run `npm i`.

- `node server` - Start the dev server.

- `node make clean` - Clean dist/.

- `node make compile` - Compile the site in dist/. This cleans the directory first.

- `node make lint` - Lint the JavaScript in the code base.

- `node make` - Run `lint`, then `compile`. It's equivalent to `node make lint compile`

- There's also `node make deploy`, but that requires push privileges first.

If you'd prefer, there's also `npm run compile` for `node make` and `npm run server` for `node server`

## Description of files:

- [src/][src]

  Where all the client files are. This includes Jade, CSS, and JS files.

- [src/blog/][blog]

  Where my blog posts live, all written in [Markdown][markdown], particularly [GitHub-Flavored Markdown][gfm] (with [YAML][yaml] metadata).

- dist/

  Where all the auto-generated files are.

- dist-base/

  A template for dist/

- [make.js, scripts/make.js][make]

  Built off of my homegrown build system, an experiment with a truly concurrent JS build system, not merely asynchronous like [Gulp][gulp] or [Grunt][grunt]. And this isn't exactly a massive website written in 10 different languages, so that simplifies the matter.

- [server.js, scripts/server.js][server]

  A simple dev server. Easy to use, and works for the job. It took a fraction of the time it would normally take for most of the premade solutions for the initial prototype (before the blog and transition from plain CSS to Stylus).

  Note that this loads the home page at http://localhost:8080/website, so that I can guarantee it's viewable on both [www.isiahmeadows.com](http://www.isiahmeadows.com) and [isiahmeadows.github.io](http://isiahmeadows.github.io/website).

- scripts/

  My build system experiment + helper utilities.

## Technologies:

- [Jade][jade], for preprocessing HTML.

- [Stylus][stylus] to preprocess the CSS.

- [Autoprefixer][autoprefixer], for automatically adding prefixes to the CSS. This is used via the [autoprefixer-stylus][autoprefixer-stylus] plugin.

- [Express][express] + a [couple][stylus-middleware] [related][morgan] middlewares, for a simple development server that "just works" without extra annoying configuration (it's only a few small files).

- [HTML Minifier][html-minifier] + [Clean CSS][clean-css] + [UglifyJS][uglifyjs] for minifying the files before they go into the wild, where people don't need to download pretty source code to view pretty content. :wink:

- A [custom build system][build-system] for this thing, as an experiment with a truly concurrent JavaScript-based and [promise-based][es6-promise] build system. The initial callback-based prototype was written about as quick as a typical setup would take, but it didn't scale very well. So I turned to promises, and started experimenting. [It turned out surprisingly elegant.][make]

- GitHub Pages, to host this thing.

## License/Copyrights

&copy; 2015 Isiah Meadows. Some Rights Reserved.

All the content in this website is under the [CC-BY 4.0 International][cc-by-4], and the source code of this website is under the [ISC License][isc], unless otherwise stated. Both of these licenses may be viewed in the [LICENSE][license] file.

*One example includes my music, in which many of the older songs are under the CC-BY-SA or CC-BY-NC licenses. I am trying my best to make sure that's clear here and in the website. Note that those aren't even hosted here.*

[node]: https://nodejs.org/en/
[src]: https://github.com/isiahmeadows/website/tree/master/src
[blog]: https://github.com/isiahmeadows/website/tree/master/src/blog
[markdown]: https://help.github.com/articles/markdown-basics/
[gfm]: https://help.github.com/articles/github-flavored-markdown/
[yaml]: http://yaml.org/
[make]: https://github.com/isiahmeadows/website/blob/master/scripts/make.js
[gulp]: http://gulpjs.com/
[grunt]: http://gruntjs.com/
[server]: https://github.com/isiahmeadows/website/blob/master/scripts/server.js
[jade]: http://gruntjs.com/
[stylus]: http://stylus-lang.com/
[autoprefixer]: https://twitter.com/autoprefixer
[autoprefixer-stylus]: https://www.npmjs.com/package/autoprefixer-stylus
[express]: http://expressjs.com/
[stylus-middleware]: http://stylus-lang.com/docs/middleware.html
[morgan]: https://www.npmjs.com/package/morgan
[html-minifier]: https://kangax.github.io/html-minifier/
[clean-css]: https://www.npmjs.com/package/clean-css
[uglifyjs]: http://lisperator.net/uglifyjs/
[build-system]: https://github.com/isiahmeadows/website/tree/master/scripts
[es6-promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[cc-by-4]: https://creativecommons.org/licenses/by/4.0/
[isc]: https://opensource.org/licenses/ISC
[license]: https://github.com/isiahmeadows/website/blob/master/LICENSE
