(function (context) {
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['base64', 'bind'];

function factory(base64) {
  var bind = Function.prototype.bind;

  var EOL = '\n';

  /* jscs:disable maximumLineLength */
  //                                   NUL-/    0-9   :-@    A-Z   [-`    a-z   {-■
  var NON_ALPHANUMERIC_ASCII_RE = /[\u0000-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u00fe]/g;
  /* jscs:enable maximumLineLength */

  var UNSAFE_ATTR_RE = NON_ALPHANUMERIC_ASCII_RE;
  var UNSAFE_CSS_RE = NON_ALPHANUMERIC_ASCII_RE;
  var UNSAFE_ELEMENT_RE = /["&'\/<>`]/g;
  var UNSAFE_JS_RE = NON_ALPHANUMERIC_ASCII_RE;
  var UNSAFE_URL_RE = NON_ALPHANUMERIC_ASCII_RE;

  // echo() and encode.*() functions for embedded JavaScript code are equivalent
  // to the template delimiters ${}, ={}, +{}, :{}, >{}, !{}, -{}, and %{}.
  var ECHO =
      'var _xj=[].join.call.bind([].join);'
    + 'function echo(){_xr+=_xj(arguments,"");}'
    + 'var encode={'
    +   'attr:function(){_xr+=_xe.a(_xj(arguments,""));},'
    +   'base64:function(){_xr+=_xe.b(_xj(arguments,""));},'
    +   'base64ni:function(){_xr+=_xe.n(_xj(arguments,""));},'
    +   'css:function(){_xr+=_xe.c(_xj(arguments,""));},'
    +   'html:function(){_xr+=_xe.h(_xj(arguments,""));},'
    +   'js:function(){_xr+=_xe.j(_xj(arguments,""));},'
    +   'uri:function(){_xr+=_xe.u(_xj(arguments,""));}'
    + '};\n';

  var ENCODER_BY_SELECTOR = {
    '=': 'a',
    '+': 'b',
    ':': 'c',
    '>': 'h',
    '!': 'j',
    '-': 'n',
    '%': 'u'
  };

  var ENTITIES_BY_CHAR = {
    '"': '&#34;',
    '&': '&#38;',
    "'": '&#39;',
    '/': '&#47;',
    '<': '&lt;',
    '>': '&gt;',
    '`': '&#96;'
  };

  function charToAttrEntity(c) {
    return ENTITIES_BY_CHAR[c] || '&#' + c.charCodeAt(0) + ';';
  }

  function charToCssUnicode(c) {
    var code = c.charCodeAt(0).toString(16);
    var size = code.length;

    return '\\' + (new Array(7 - size).join(0)) + code;
  }

  function charToHtmlEntity(c) {
    return ENTITIES_BY_CHAR[c];
  }

  function charToJsHex(c) {
    var code = c.charCodeAt(0).toString(16);
    var size = code.length;

    return '\\x' + (new Array(3 - size).join(0)) + code;
  }

  function charToUriHex(c) {
    var code = c.charCodeAt(0).toString(16);
    var size = code.length;

    return '%' + (new Array(3 - size).join(0)) + code;
  }

  var encode = {
    // HTML Attribute
    a: function (string) {
      return ('' + string).replace(UNSAFE_ATTR_RE, charToAttrEntity);
    },

    // base64
    b: base64.encode,

    // CSS Value
    c: function (string) {
      return ('' + string).replace(UNSAFE_CSS_RE, charToCssUnicode);
    },

    // HTML Element
    h: function (string) {
      return ('' + string).replace(UNSAFE_ELEMENT_RE, charToHtmlEntity);
    },

    // JavaScript
    j: function (string) {
      return ('' + string).replace(UNSAFE_JS_RE, charToJsHex);
    },

    // base64ni (unpadded base64url)
    n: base64.ni.encode,

    // URI
    u: function (string) {
      return ('' + string).replace(UNSAFE_URL_RE, charToUriHex);
    }
  };

  function parse(string, options) {
    options = options || {};
    var parts = ['_xr=""'];

    var depth = 0;
    var inExpression = false;
    var isEvaluation = false;
    var isInsertion = false;

    var anechoic = true;
    var comment = '';
    var delimiter = '\x7d'/*close curly brace*/;
    var expression = [];
    var fragment = [];
    var infix = '+\n';
    var quote = '';
    var selector = '';

    for (var x = 0, nx = string.length; x < nx; ++x) {
      var nc = string[x + 1];
      var c = string[x];
      var index;

      if (inExpression) {
        while (quote) {
          if (c === '\\') {
            expression[expression.length] = c + string[++x];
          } else {
            if (c === quote) {
              quote = '';
            }

            expression[expression.length] = c;
          }

          c = string[++x];
        }

        while (comment) {
          if (comment === '/') {
            for (; c && c !== EOL[0]; c = string[++x]) {
              // Ignore comments.
            }

            if (c && c === EOL[1]) {
              // Ignore the second character of two-character line endings.
              ++x;
            }
          }

          if (comment === '*') {
            for (; c && (c !== '*' || string[x + 1] !== '/'); c = string[++x]) {
              // Ignore comments.
            }

            // Ignore the final two block comment characters.
            x += 2;
          }

          comment = '';
        }

        for (index = x;
             c === ' '  ||
             c === '\f' ||
             c === '\n' ||
             c === '\t' ||
             c === '\r' ||
             c === '\u200b';
             c = string[++x]) {}

        x = x === index ? x : x - 1;
        c = string[index];

        if (c === '"' || c === '\'') {
          quote = c;
        } else if (c === '/' && (nc === '/' || nc === '*')) {
          comment = nc;
          ++x;
          continue;
        } else if (c === '\\' &&
                   (nc === '=' ||
                    nc === '+' ||
                    nc === ':' ||
                    nc === '>' ||
                    nc === '!' ||
                    nc === '-' ||
                    nc === '%' ||
                    nc === '$')) {
          expression[expression.length] = string[++x];
          continue;
        } else if (delimiter === '\x7d'/*close*/ && c === '\x7b'/*open*/) {
          ++depth;
        } else if (c === delimiter) {
          if (delimiter === '\x7d'/*close curly brace*/ && depth) {
            --depth;
          } else {
            expression = expression.join('').trim();

            if (isEvaluation) {
              expression = ';\n' + expression;
              infix = ';\n_xr+=\n';
            } else if (isInsertion) {
              expression = infix + '((_xi=' + expression + ')==null?"":_xi)';
              infix = '+\n';
            } else {
              var e = ENCODER_BY_SELECTOR[selector];
              expression = infix + '_xe.' + e + '(' + expression + ')';
              infix = '+\n';
            }

            parts[parts.length] = expression;
            expression = [];
            inExpression = false;
            isEvaluation = false;
            isInsertion = false;

            continue;
          }
        }

        expression[expression.length] = c;
      } else if ((c === '=' || // a(ttribute)        encode.attr(...)
                  c === '+' || // b(ase64)           encode.base64(...)
                  c === ':' || // c(ss property)     encode.css(...)
                  c === '>' || // h(tml element)     encode.html(...)
                  c === '!' || // j(avascript)       encode.js(...)
                  c === '-' || // n(i digest value)  encode.base64ni(...)
                  c === '%' || // u(ri)              encode.uri(...)
                  c === '$') && nc === '\x7b'/*open curly brace*/) {
        if (anechoic) {
          parts[0] = ECHO + parts[0];
          anechoic = false;
        }

        inExpression = true;
        isEvaluation = false;
        isInsertion = c === '$';

        selector = c;
        delimiter = '\x7d'/*close curly brace*/;

        parts[parts.length] = infix + JSON.stringify(fragment.join(''));
        fragment = [];

        ++x;
      } else if (c === '`') {
        if (anechoic) {
          parts[0] = ECHO + parts[0];
          anechoic = false;
        }

        inExpression = true;
        isEvaluation = true;
        isInsertion = false;

        selector = '';
        delimiter = '`';

        parts[parts.length] = infix + JSON.stringify(fragment.join(''));
        fragment = [];
      } else {
        // FIXME: Don’t collapse white space in pre elements (and/or possibly in
        // elements matching designated CSS selectors).
        if (options.collapseWhiteSpace) {
          for (index = x;
               c === ' '  ||
               c === '\f' ||
               c === '\n' ||
               c === '\t' ||
               c === '\r' ||
               c === '\u200b';
               c = string[++x]) {}

          x = x === index ? x : x - 1;
          c = string[index];
        }

        fragment[fragment.length] = c;
      }
    }

    if (fragment.length > 0) {
      parts[parts.length] = infix + JSON.stringify(fragment.join(''));
    }

    // console.error(parts.join('') + ';\nreturn _xr;\n');
    return parts.join('') + ';\nreturn _xr;\n';
  }

  var ARGN = ['_xe', '_xi', '_xr'];
  var ARGV = [encode, '', ''];

  var MAX_CACHE_SIZE = 256;
  var cache = {};
  var cacheSize = 0;

  function stencil(string, args) {
    var argn = [];
    var argv = [undefined];
    /* jshint -W040 */
    var options = this && this.options || {};
    /* jshint +W040 */

    for (var x = 0, nx = ARGN.length; x < nx; ++x) {
      argn[argn.length] = ARGN[x];
      argv[argv.length] = ARGV[x];
    }

    for (var n in args) {
      argn[argn.length] = n;
      argv[argv.length] = args[n];
    }

    if (options.cache !== true) {
      return bind.apply(new Function(argn, parse(string, options)), argv)();
    }

    // Every cached parsing will include this option so we can ignore it now.
    delete options.cache;

    var cs = cache[string];
    if (cs === undefined) {
      if (cacheSize === MAX_CACHE_SIZE) {
        for (var k in cache) {
          delete cache[k];
          break;
        }
      }

      cs = cache[string] = {};
    }

    var key = argn.slice().sort().join(',') + ';' +
        Object.keys(options).sort().reduce(function (a, k) {
          a[a.length] = k + ':' + options[k];
          return a;
        }, []).join(',');

    var fn = cs[key] =
    /* jshint -W054 */
        cs[key] || bind.apply(new Function(argn, parse(string, options)), argv);
    /* jshint +W054 */

    return fn();
  }

  stencil.opt = function (name, value) {
    if (!name) {
      return stencil;
    }

    function fn(string, args) {
      return stencil.call(fn, string, args);
    }

    fn.options = {};
    fn.opt = function (name, value) {
      if (name) {
        // TODO: Only allow designated option names?
        if (typeof name === 'string') {
          fn.options[name] = value;
        } else {
          for (var n in name) {
            fn.options[n] = name[n];
          }
        }
      }

      return fn;
    };

    return fn.opt.apply(undefined, arguments);
  };

  return stencil;
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

/**
 * Encoding
 *
 * ?{[?;...]...}
 * ?              - Selector ($, =, +, :, >, !, -, %)
 *  {
 *   [
 *    ?;          - Optional Inner Selector
 *      ...       - Additional Inner Selectors (?; × n)
 *         ]
 *          ...   - Input Data
 *             }
 *
 * Echoed (Not Encoded)
 *
 * ${...}
 *
 * Singly Encoded
 *
 * >{...} HTML Element
 * ={...} HTML Attribute
 * !{...} JavaScript
 * %{...} URI
 * +{...} base64
 * -{...} base64ni - Replace all '+' with '-', '/' with '_', and '=' with ''.
 *
 * Jointly Encoded (Nested)
 *
 * !{>;...} HTML Element then JavaScript   - encode.js(encode.html(...))
 * !{%;...} URI then JavaScript            - encode.js(encode.uri(...))
 * !{!;...} Double JavaScript              - encode.js(encode.js(...))
 */
