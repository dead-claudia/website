!function(){"use strict";function e(e){return{href:e,config:m.route}}function t(e){return null!=e&&/^[\w ,\-]+$/.test(e)}function n(e){return null!=e?e.split(/\s*,\s*/g):[]}function o(e){return e.replace(/&<"/g,function(e){return"&"===e?"&amp;":"<"===e?"&lt;":"&quot;"})}function r(){h=Object.create(null),v().forEach(function(e){e.tags.forEach(function(t){t=t.toLowerCase();var n=h[t]=h[t]||[];n.indexOf(e)<0&&n.push(e)})})}function a(e){if(null==h&&r(),!t(e))return[];var o=[],a=Object.create(null);return n(e.toLowerCase()).forEach(function(e){h[e]&&h[e].forEach(function(e){a[e.url]||(a[e.url]=!0,o.push(e))})}),o}function i(){try{window.ga("send","pageview",location.pathname+m.route())}catch(e){}}m.deferred.onerror=function(){var e=m.deferred.onerror;return function(t){return"undefined"!=typeof console&&console.error&&console.error(t),e(t)}}();var s={controller:function(){var e=m.route.param("tag"),n=this;this.fail=m.prop(null!=e&&!t(e)),this.value=m.prop(null!=e?e:""),this.onsubmit=function(e){e=e||event,e.defaultPrevented||13!==(e.which||e.keyCode)&&"Enter"!==e.key||(e.preventDefault(),e.stopPropagation(),t(n.value())?m.route("/tags/"+encodeURIComponent(n.value())):n.fail(!0))}},view:function(e){return m(".tag-search",[m("label","Search for tag:"),m("input[type=text]",{value:e.value(),oninput:m.withAttr("value",e.value),onkeydown:e.onsubmit}),e.fail()?m(".warning",["Tags may only be a comma-separated list of phrases."]):null])}},u={view:function(){return m(".summary-header",[m(".summary-title","Posts, sorted by most recent."),m(s)])}},l={controller:function(e,o){if(t(o)){var r,a=n(o);if(1===a.length)r="'"+a[0]+"'";else if(2===a.length)r="'"+a[0]+"' or '"+a[1]+"'";else{var i=a.pop();r=a.map(function(e){return"'"+e+"'"}).join(", ")+", or '"+i+"'"}this.banner="Posts tagged "+r+" ("+e+" post"+(1===e?"":"s")+"):"}else this.banner="Invalid tag: '"+o+"'"},view:function(t){return m(".summary-header",[m(".summary-title",[m(".tag-title",t.banner),m("a.back",e("/"),["Back to posts ",m.trust("&#9658;")])]),m(s)])}},c={view:function(t,n,o,r){return m(".post-tags",[m("span","Tags:"),n.tags.map(function(t){var n=o&&t===r?".post-tag-active":"";return m("a.post-tag"+n,e("/tags/"+t),t)})])}},f={view:function(e,t,n){return m(".feed",[t+" feed",m("a",{href:n},[m("img.feed-icon[src=./feed-icon-16.gif]")])])}},p={view:function(t,n,o){var r=m.route.param("tag"),a=r&&r.toLowerCase();return m(".blog-summary",[m("p",["My ramblings about everything (religion, politics, ","coding, etc.)"]),m(f,"Atom","blog.atom.xml"),m(f,"RSS","blog.rss.xml"),o?m(l,n.length,a):m(u),m(".blog-list",n.map(function(t){return m(".blog-summary-item",[m(".post-date",t.date.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})),m("a.post-stub",e("/posts/"+t.url),[m(".post-title",t.title),m(".post-preview",t.preview,"...")]),m(c,t,o,a)])}))])}},d=new marked.Renderer;d.code=function(e,t){return'<pre><code class="hljs hljs-'+t+'">'+hljs.highlight(t,e).value+"</code></pre>"},d.image=function(e,t,n){var r=/\s=\s*(\d*%?)\s*x\s*(\d*%?)\s*$/.exec(e);r&&(e=e.slice(0,-r[0].length));var a='<img src="'+o(e)+'" alt="'+o(n);return t&&(a+='" title="'+o(t)),r&&r[1]&&(a+='" height="'+r[1]),r&&r[2]&&(a+='" width="'+r[2]),a+'">'},marked.setOptions({sanitize:!0,renderer:d});var h,g={controller:function(e){var t=this.content=m.prop();m.request({method:"GET",url:"./blog/"+e.url,deserialize:function(e){return e}}).then(function(e){t(marked(e))&&m.redraw()})},view:function(t,n){return m(".blog-post",[m("a.post-home",e("/"),"Home ",m.trust("&#9658;")),m("h3.post-title",n.title),m(".post-body",[null!=t.content()?m.trust(t.content()):m(".post-loading","Loading...")]),m(c,n),m("a.post-home",e("/"),"Home ",m.trust("&#9658;"))])}},v=m.prop(),w=Object.create(null),y=m.deferred(),b=m.request({method:"GET",url:"./blog.json"}).then(function(e){return e.posts}).then(v).then(function(e){var t=6e4*((new Date).getTimezoneOffset()-300);e.forEach(function(e){e.date=new Date(Date.parse(e.date)+t),w[e.url]=e}),e.sort(function(e,t){return t.date-e.date})});document.addEventListener("DOMContentLoaded",function(){document.getElementById("info").innerHTML="<p>Loading...</p><p>If this text doesn't disappear within a few seconds, you may have to reload the page, as the blog is loading slowly. If that doesn't help (as in you still see this message after reloading), then <a href='contact.html'>please tell me</a>. As soon as I get the message, I'll try to get it fixed as soon as I can.</p><p>If you happen to use GitHub, you can also tell me <a href='https://github.com/isiahmeadows/website'>here</a>, and if you'd like, feel free to help me fix whatever it is.</p>",y.resolve()}),m.sync([b,y.promise]).then(function(){m.route.mode="hash",m.route(document.getElementById("blog"),"/",{"/":{controller:i,view:function(){return m(p,v())}},"/posts/:post":{controller:i,view:function(){return m(g,w[m.route.param("post")])}},"/tags/:tag":{controller:function(){window.ga("send","pageview",location.pathname+"/tags")},view:function(){return m(p,a(m.route.param("tag")),!0)}}}),m.route(m.route())})}();