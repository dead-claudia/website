!function(){"use strict";function e(e){i="";for(var n=0;8>n;n++)i+=a[62*Math.random()|0];e.innerHTML=i}function n(){var e=document.getElementById("email--base");return{input:e.getElementsByTagName("input")[0],text:e.getElementsByTagName("p")[0],random:e.getElementsByTagName("code")[0],submit:e.getElementsByTagName("button")[0],wrong:e.getElementsByTagName("div")[1]}}function t(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function r(){var e=m.slice(1).replace(/[^\.@acdehimosw]/g,""),n=document.createElement("a");return n.innerHTML=e,n.href="mailto:"+e,n}for(var a="",o=0;10>o;o++)a+=o;for(;36>o;)a+=String.fromCharCode(55+o++);for(;62>o;)a+=String.fromCharCode(61+o++);var i,m="@mbef@gi23#jfski^\\l2anhp\x00m2r%etaud??voxwys&.*c<ozm";window.addEventListener("load",function(){function a(n){if(n.preventDefault(),n.stopPropagation(),o.input.value===i){var a=m.slice(1).replace(/[^\.@acdehimosw]/g,""),d=document.createElement("a");d.innerHTML=a,d.href="mailto:"+a,t(o.text),o.text.appendChild(r()),o.input.parentNode.removeChild(o.input),o.wrong.parentNode.removeChild(o.wrong),o.submit.parentNode.removeChild(o.submit),o.submit.onclick=void 0,o=null}else{e(o.random);var l=o.wrong;l.className=l.className.replace(/\bhidden\b/,"")}}var o=n();e(o.random),o.input.onkeydown=function(e){e=e||event,e.defaultPrevented||(13===(e.which||e.keyCode)||"Enter"===e.key)&&a(e)},o.submit.onclick=function(e){e=e||event,e.defaultPrevented||a(e)}})}();