document.addEventListener("DOMContentLoaded",function(){"use strict";var e=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,t=document.querySelector("#contact > form");/[?&]w/.test(location.search)&&(t.elements.subject.value="Website design request",t.elements.email.value="Don't forget to leave me a way to get back to you!"),t.onchange=function(t){t.stopPropagation(),null!=e&&"hidden"===t.target.type&&(e=void 0,document.getElementById("contact-locked").classList.remove("hidden"))},t.onsubmit=function(t){if(t.preventDefault(),t.stopPropagation(),null!=e){var s=[];/^\s*$/.test(this.elements.name.value)&&s.push("A name is required, even if it's a pseudonym."),this.elements.email.value&&!e.test(this.elements.email.value)&&s.push("An email address must be valid if given."),/^\s*$/.test(this.elements.subject.value)&&s.push("A subject is required."),/^\s*$/.test(this.elements.message.value)&&s.push('A message is required. "See title" works.');var a=document.getElementById("contact-errors");if(s.length){a.classList.remove("hidden");for(var n=a.querySelector("ul");null!=n.firstChild;)n.removeChild(n.firstChild);for(var i=0;i<s.length;i++){var l=document.createElement("li");l.appendChild(document.createTextNode(s[i])),n.appendChild(l)}}else{a.classList.add("hidden");var o=new XMLHttpRequest;o.open("POST","https://formspree.io/me@isiahmeadows.com"),o.setRequestHeader("Accept","application/json"),o.setRequestHeader("Content-Type","application/json"),o.onreadystatechange=function(e){if(4===this.readyState){if(200!==this.status)throw e;location.href="./contact-finish.html"}},this.elements.email.value?o.send(JSON.stringify({name:this.elements.name.value,_subject:"[Personal Site] "+this.elements.subject.value,message:this.elements.message.value,email:this.elements.email.value})):o.send(JSON.stringify({name:"(Anonymous) "+this.elements.name.value,_subject:"[Personal Site] "+this.elements.subject.value,message:this.elements.message.value}))}}}});