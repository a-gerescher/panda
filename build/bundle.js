
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function () {
  'use strict';

  var styles = "";;

  var ref = window.preact;
  var h = ref.h;
  var render = ref.render;

  var App = function () {
    return (
      h( 'div', null, 
        h( 'span', null, "Hello, world6! I beat the bundler" )
      )
    );
  };

  render(h( App, null ), document.getElementById("demo"));

}());
