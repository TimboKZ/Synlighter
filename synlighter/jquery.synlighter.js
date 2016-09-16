//
// Synlighter, http://kuzhagaliyev.kz/synlighter/
//
// © Copyright Timur Kuzhagaliyev 2013-2014,  
// This jQuery plugin is distributed under
// the terms of MIT license.
// http://kuzhagaliyev.kz/synlighter/license
//

(function ($) {
    var Synlighter = function (element, options) {

        var synlighterVersion = '2.0.0';

        var container = $(element);
        var warnings = [];
        var settings = $.extend({
            allowOverwrite: true,
            colorScheme: 'dark',
            maxHeight: null,
            counter: null,
            langAttr: 'data-language',
            suppressWarnings: false,
            callback: function() {}
        }, options || {});


        // Quote highlighting function
        var highlightQuote = function (lang, highlightedSyntax) {
            if (lang == 'html') {
                return highlightedSyntax;
            }
            var doubleQuoteArray = highlightedSyntax.split('&quot;');
            var singleQuoteArray = highlightedSyntax.split('&#39');
            var highlightSingleQuotes = function (lang, highlightedSyntax) {
                highlightedSyntax = highlightedSyntax.replace(/\\?&#39;.*?\\?&#39;/g, function (match) {
                    if (match.substring(0, 1) == '\\' || match.substring(match.length - 6, match.length - 5) == '\\') {
                        return match;
                    }
                    var contentOfQuotes = match;
                    contentOfQuotes = contentOfQuotes.replace(/&quot;/g, '<synlighter-double-quote>');
                    contentOfQuotes = contentOfQuotes.replace(/\/\//g, '&#47&#47');
                    contentOfQuotes = contentOfQuotes.replace(/^&#39;/, '');
                    contentOfQuotes = contentOfQuotes.replace(/&#39;$/, '');
                    var quoteMarkup = '<span class="synlighter-highlight-' + lang + '-singlequote">&#39;</span>';
                    return quoteMarkup + '<span class="synlighter-highlight-' + lang + '-singlequote-content">' + contentOfQuotes + '</span>' + quoteMarkup;
                });
                return highlightedSyntax;
            };
            var highlightDoubleQuotes = function (lang, highlightedSyntax) {
                highlightedSyntax = highlightedSyntax.replace(/\\?&quot;.*?\\?&quot;/g, function (match) {
                    if (match.substring(0, 1) == '\\' || match.substring(match.length - 7, match.length - 6) == '\\') {
                        return match;
                    }
                    var contentOfQuotes = match;
                    contentOfQuotes = contentOfQuotes.replace(/&#39;/g, '<synlighter-single-quote>');
                    contentOfQuotes = contentOfQuotes.replace(/\/\//g, '&#47&#47');
                    contentOfQuotes = contentOfQuotes.replace(/^&quot;/, '');
                    contentOfQuotes = contentOfQuotes.replace(/&quot;$/, '');
                    var quoteMarkup = '<span class="synlighter-highlight-' + lang + '-doublequote">&quot;</span>';
                    return quoteMarkup + '<span class="synlighter-highlight-' + lang + '-doublequote-content">' + contentOfQuotes + '</span>' + quoteMarkup;
                });
                return highlightedSyntax;
            };
            if (doubleQuoteArray[0].length > singleQuoteArray[0].length) {
                // ' (single quote) comes first
                highlightedSyntax = highlightSingleQuotes(lang, highlightedSyntax);
                highlightedSyntax = highlightDoubleQuotes(lang, highlightedSyntax);
            } else {
                // " (double quote) comes first
                highlightedSyntax = highlightDoubleQuotes(lang, highlightedSyntax);
                highlightedSyntax = highlightSingleQuotes(lang, highlightedSyntax);
            }
            highlightedSyntax = highlightedSyntax.replace(/<synlighter-single-quote>/g, '&#39;');
            highlightedSyntax = highlightedSyntax.replace(/<synlighter-double-quote>/g, '&quot;');
            return highlightedSyntax;
        };
        // Comment highlighting function
        var highlightComment = function (lang, highlightedSyntax) {
            if (lang == 'js' || lang == 'php') {
                highlightedSyntax = highlightedSyntax.replace(/\\?&#47;&#47;.*?<br>/g, function (match) {
                    if (match.substring(0, 1) == '\\') {
                        return match;
                    }
                    var matched = match;
                    matched = matched.replace(/&#39;/g, '<synlighter-single-quote>');
                    matched = matched.replace(/&quot;/g, '<synlighter-double-quote>');
                    return '<span class="synlighter-highlight-' + lang + '-comment">' + matched + '</span>';
                });
            }
            if (lang == 'js' || lang == 'php' || lang == 'css') {
                highlightedSyntax = highlightedSyntax.replace(/\\?&#47;\*.*?\*\\?&#47;/g, function (match) {
                    if (match.substring(0, 1) == '\\' || match.substring(match.length - 6, match.length - 5) == '\\') {
                        return match;
                    }
                    var matched = match;
                    matched = matched.replace(/&#39;/g, '<synlighter-single-quote>');
                    matched = matched.replace(/&quot;/g, '<synlighter-double-quote>');
                    return '<span class="synlighter-highlight-' + lang + '-comment">' + matched + '</span>';
                });
            }
            return highlightedSyntax;
        };
        // HTML highlighting function
        var highlightHTML = function (highlightedSyntax) {
            var tagsDark = {};
            tagsDark['a'] = 'color:#93da7e;';
            tagsDark['script'] = 'color:#ffc5b3;';
            tagsDark['style'] = 'color:#ffb0ea;';
            tagsDark['link'] = 'color:#ffccf1;';
            tagsDark['li'] = 'color:#80ff9a;';
            tagsDark['h1'] = 'color:#ffc780;';
            tagsDark['h2'] = 'color:#ffc780;';
            tagsDark['h3'] = 'color:#ffc780;';
            tagsDark['h4'] = 'color:#ffc780;';
            tagsDark['h5'] = 'color:#ffc780;';
            tagsDark['h6'] = 'color:#ffc780;';
            tagsDark['p'] = 'color:#ffc780;';
            tagsDark['form'] = 'color:#ffff80;';
            tagsDark['code'] = 'color:#ffb580;';
            tagsDark['pre'] = 'color:#cdff80;';
            tagsDark['input'] = 'color:#ffff80;';
            var scriptCount = 0;
            var scriptArray = {};
            highlightedSyntax = highlightedSyntax.replace(/&lt;script[(&nbsp;)(&quot;)(&#45;)(&#39;)(&#47;)\.A-Za-z0-9]*&gt;.*?&lt;&#47;script&gt;/g, function (match) {
                var matched = match;
                var beginning = '';
                var end = '';
                matched = matched.replace(/^&lt;script[(&nbsp;)(&quot;)(&#45;)(&#39;)(&#47;)\.A-Za-z0-9]*&gt;/, function (match) {
                    beginning = match;
                    return '';
                });
                matched = matched.replace(/&lt;&#47;script&gt;$/, function (match) {
                    end = match;
                    return '';
                });
                scriptArray[scriptCount] = matched;
                scriptCount++;
                return beginning + '<synlighter-script-' + scriptCount + '>' + end;
            });
            var styleCount = 0;
            var styleArray = {};
            highlightedSyntax = highlightedSyntax.replace(/&lt;style[(&nbsp;)(&quot;)(&#45;)(&#39;)(&#47;)\.A-Za-z0-9]*&gt;.*?&lt;&#47;style&gt;/g, function (match) {
                var matched = match;
                var beginning = '';
                var end = '';
                matched = matched.replace(/^&lt;style[(&nbsp;)(&quot;)(&#45;)(&#39;)(&#47;)\.A-Za-z0-9]*&gt;/, function (match) {
                    beginning = match;
                    return '';
                });
                matched = matched.replace(/&lt;&#47;style&gt;$/, function (match) {
                    end = match;
                    return '';
                });
                styleArray[styleCount] = matched;
                styleCount++;
                return beginning + '<synlighter-style-' + scriptCount + '>' + end;
            });
            highlightedSyntax = highlightedSyntax.replace(/&lt;[a-zA-Z1-9!&#47;].*?&gt;/g, function (match) {
                var inTag = match;
                var tagIsComment = inTag.replace(/^&lt;!&#45;&#45;/, '');
                tagIsComment = tagIsComment.replace(/&#45;&#45;&gt;$/, '');
                if (inTag == '&lt;!&#45;&#45;' + tagIsComment + '&#45;&#45;&gt;') {
                    return '<span class="synlighter-highlight-html-comment">' + inTag + '</span>';
                } else {
                    inTag = inTag.replace(/&quot;.*?&quot;/g, function (match) {
                        var matched = match;
                        matched = matched.replace(/^&quot;/, '');
                        matched = matched.replace(/&quot;$/, '');
                        return '<span class="synlighter-highlight-html-doublequote">&quot;</span><span class="synlighter-highlight-html-doublequote-content">' + matched + '</span><span class="synlighter-highlight-html-doublequote">&quot;</span>';
                    });
                    inTag = inTag.replace(/&#39;.*?&#39;/g, function (match) {
                        var matched = match;
                        matched = matched.replace(/^&#39;/, '');
                        matched = matched.replace(/&#39;$/, '');
                        return '<span class="synlighter-highlight-html-singlequote">&#39;</span><span class="synlighter-highlight-html-singlequote-content">' + matched + '</span><span class="synlighter-highlight-html-singlequote">&#39;</span>';
                    });
                    inTag = inTag.replace(/\&nbsp;[a-zA-Z(&#45;)]*&#61;.*?/g, function (match) {
                        var attr = match.replace(/&#61;/, '');
                        attr = attr.replace(/&nbsp;/, '');
                        return '&nbsp;<span class="synlighter-highlight-html-attr">' + attr + '</span>&#61;';
                    });
                    var tag = inTag.split('&nbsp;');
                    tag = tag[0];
                    tag = tag.replace('&lt;', '');
                    tag = tag.replace('&gt;', '');
                    tag = tag.replace('&#47;', '');
                    var regExp = new RegExp('^&lt;' + tag);
                    inTag = inTag.replace(regExp, '&lt;<span class="synlighter-highlight-html-tagname">' + tag + '</span>');
                    if (tagsDark[tag] != null) {
                        return '<span class="synlighter-highlight-html-tag-default" style="' + tagsDark[tag] + '">' + inTag + '</span>';
                    } else {
                        return '<span class="synlighter-highlight-html-tag-default">' + inTag + '</span>';
                    }
                }
            });
            $.each(scriptArray, function (key, script) {
                var regexp = new RegExp('<synlighter-script-' + key + '>');
                highlightedSyntax = highlightedSyntax.replace(regexp, highlightJS(script));
            });
            $.each(styleArray, function (key, style) {
                var regexp = new RegExp('<synlighter-style-' + key + '>');
                highlightedSyntax = highlightedSyntax.replace(regexp, highlightCSS(style));
            });
            return highlightedSyntax;
        };
        // JS highlighting function
        var highlightJS = function (highlightedSyntax) {
            var replaceWords = ['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'document', 'finally', 'var', 'return', 'for', 'while', 'new', 'in', 'switch', 'with', 'void', 'typeof', 'try', 'throw', 'this', 'else', 'null', 'true', 'false', 'instanceof'];
            highlightedSyntax = highlightedSyntax.replace(/\w*/g, function (match) {
                if ($.inArray(match, replaceWords) > -1) {
                    return '<span class="synlighter-highlight-js-word">' + match + '</span>';
                }
                return match;
            });
            highlightedSyntax = highlightedSyntax.replace(/[0-9]+(\.[0-9]+)?[^0-9]{1}/g, function (match) {
                if (match.substring(match.length - 1) == ';') {
                    return match;
                }
                return '<span class="synlighter-highlight-js-number">' + match.substring(0, match.length - 1) + '</span>' + match.substring(match.length - 1);
            });
            highlightedSyntax = highlightedSyntax.replace(/(\.|&nbsp;|\()[A-Za-z0-9]+(\()/g, function (match) {
                var matched = match;
                matched = matched.replace(/\($/, '');
                var firstChar = matched.substring(0, 1);
                var prefix = '';
                if (firstChar == '.') {
                    prefix = '.';
                    matched = matched.replace(/^\./, '');
                } else if (firstChar == '&') {
                    prefix = '&nbsp;';
                    matched = matched.replace(/^&nbsp;/, '');
                } else if (firstChar == '(') {
                    prefix = '(';
                    matched = matched.replace(/^\(/, '');
                }
                return prefix + '<span class="synlighter-highlight-js-method">' + matched + '</span>(';
            });
            highlightedSyntax = highlightedSyntax.replace(/(\(|\))/g, function (match) {
                return '<span class="synlighter-highlight-js-bracket">' + match + '</span>';
            });
            highlightedSyntax = highlightedSyntax.replace(/(\{|})/g, function (match) {
                return '<span class="synlighter-highlight-js-figurebracket">' + match + '</span>';
            });
            highlightedSyntax = highlightedSyntax.replace(/(\[|])/g, function (match) {
                return '<span class="synlighter-highlight-js-squarebracket">' + match + '</span>';
            });
            highlightedSyntax = highlightComment('js', highlightedSyntax);
            highlightedSyntax = highlightedSyntax.replace(/(&lt;|&gt;|&#61;|&#45;|\+|\*|&#47;|\||%)/g, function (match) {
                return '<span class="synlighter-highlight-js-operator">' + match + '</span>';
            });
            highlightedSyntax = highlightedSyntax.replace(/&#58;/g, '<span class="synlighter-highlight-js-colon">&#58;</span>');
            highlightedSyntax = highlightedSyntax.replace(/&#59;/g, '<span class="synlighter-highlight-js-semicolon">&#59;</span>');
            highlightedSyntax = highlightedSyntax.replace(/&#44;/g, '<span class="synlighter-highlight-js-comma">&#44;</span>');
            highlightedSyntax = highlightQuote('js', highlightedSyntax);
            highlightedSyntax = highlightedSyntax.replace(/<synlighter-single-quote>/g, '&#39;');
            highlightedSyntax = highlightedSyntax.replace(/<synlighter-double-quote>/g, '&quot;');
            return highlightedSyntax;
        };
        // JQUERY highlighting function
        var highlightJQUERY = function (highlightedSyntax) {
            highlightedSyntax = highlightJS(highlightedSyntax);
            highlightedSyntax = highlightedSyntax.replace(/(\$|jQuery)/g, function (match) {
                return '<span class="synlighter-highlight-js-jqueryobject">' + match + '</span>';
            });
            return highlightedSyntax;
        };
        // CSS highlighting function
        var highlightCSS = function (highlightedSyntax) {
            highlightedSyntax = highlightedSyntax.replace(/(^[^}{]*)(?=\{)/g, function (match) {
                return highlightCSSSelectors(match);
            });
            highlightedSyntax = highlightedSyntax.replace(/[{}][^}{]*\{/g, function (match) {
                var firstChar = '';
                var matched = match.replace(/^[{}]/, function (match) {
                    firstChar = match;
                    return '';
                });
                var lastChar = '';
                matched = matched.replace(/\{$/, function (match) {
                    lastChar = match;
                    return '';
                });
                return firstChar + highlightCSSSelectors(matched) + lastChar;
            });

            var cssPropertyRegex = /([A-Za-z]|&#45;)+(&#58;)([A-Za-z0-9.%()]|&nbsp;|&#45;|&#44;|&#39;|&quot;|&#35;)*(&#59;|(?=(&nbsp;|<br>)+}))/gi;

            // highlightedSyntax = highlightedSyntax.replace(/[A-Za-z(&#45;)]+(&#58;)[A-Za-z0-9(&#45;)(&nbsp;)()%.]+(&#59;)/g, function (match) {
            //     return highlightCSSProperties(match);
            // });
            highlightedSyntax = highlightedSyntax.replace(cssPropertyRegex, function (match) {
                return highlightCSSProperties(match);
            });
            highlightedSyntax = highlightedSyntax.replace(/(\(|\))/g, function (match) {
                return '<span class="synlighter-highlight-css-bracket">' + match + '</span>';
            });
            highlightedSyntax = highlightedSyntax.replace(/(\{|})/g, function (match) {
                return '<span class="synlighter-highlight-css-figurebracket">' + match + '</span>';
            });
            highlightedSyntax = highlightComment('css', highlightedSyntax);
            return highlightedSyntax;
        };
        var highlightCSSSelectors = function (highlightedSyntax) {
            highlightedSyntax = highlightedSyntax.replace(/\.[A-Za-z0-9_(&#45;)]+/g, function (match) {
                return '<span class="synlighter-highlight-css-class">' + match + '</span>';
            });
            highlightedSyntax = highlightedSyntax.replace(/(^|})#[A-Za-z0-9_(&#45;)]+/g, function (match) {
                return '<span class="synlighter-highlight-css-id">' + match + '</span>';
            });
            return highlightedSyntax;
        };
        var highlightCSSProperties = function (highlightedSyntax) {
            var parts = highlightedSyntax.split('&#58;');
            var prepend = '';
            var property = parts[0];
            property = property.replace(/^(&nbsp;)*/, function (match) {
                prepend = match;
                return '';
            });
            var value = parts[1];
            value = value.replace(/(&#59;)$/, '');
            return prepend + '<span class="synlighter-highlight-css-property">' + property + '</span><span class="synlighter-highlight-css-colon">:</span><span class="synlighter-highlight-css-value">' + value + '</span><span class="synlighter-highlight-css-semicolon">;</span>';
        };


        // Determine language
        var languages = ['HTML', 'CSS', 'JS', 'JavaScript', 'jQuery', 'PHP'];
        var specifiedLang = container.attr(settings.langAttr);
        var lang, title;
        if (specifiedLang != null) {
            lang = null;
            $.each(languages, function (index, language) {
                if (lang == null && language.toLowerCase() == specifiedLang.toLowerCase()) {
                    lang = language.toLowerCase();
                    title = language;
                    return false;
                }
            });
            if (lang == null) {
                lang = 'generic';
                title = specifiedLang;
                if (!settings.suppressWarnings) {
                    warnings.push('Unrecognised Language: ' + specifiedLang);
                }
            }
            if (lang == 'javascript') {
                lang = 'js';
            }
        } else {
            warnings.push('Language Not Specified.');
            lang = 'generic';
            title = 'Code';
        }


        // Determine colorscheme
        var colorSchemeClass;
        var colorScheme = settings.colorScheme;
        if (colorScheme.toLowerCase() == 'light') {
            colorSchemeClass = 'synlighter-light';
        } else {
            if (colorScheme.toLowerCase() != 'dark' && !settings.suppressWarnings) {
                warnings.push('Unrecognised Color Scheme: ' + colorScheme);
            }
            colorSchemeClass = 'synlighter-dark';
        }


        // Save original syntax
        var originalSyntax = container.html();


        // Saving original syntax as element's data
        if ($(document).data('synlighter-increment-id') == null) {
            $(document).data('synlighter-increment-id', 1);
        } else {
            $(document).data('synlighter-increment-id', $(document).data('synlighter-increment-id') + 1);
        }
        $(document).data('synlighter-syntax-' + $(document).data('synlighter-increment-id'), originalSyntax);


        // Replace xmp tag with a div
        var elem = $('<div class="synlighter synlighter-' + $(document).data('synlighter-increment-id') + ' ' + colorSchemeClass + '"></div>');
        elem.data('synlighter', container.data('synlighter'));
        container.before(elem);
        container.remove();
        container = elem;


        // Add title
        var titleDiv = $('<div class="synlighter-title"></div>');
        container.append(titleDiv);
        titleDiv.html(title);
        var titleInfo = $('<div class="synlighter-title-info"></div>');
        titleDiv.prepend(titleInfo);
        titleInfo.prepend('<a class="synlighter-title-info-button synlighter-title-info-button-info" href="http://kuzhagaliyev.kz/synlighter/" target="_blank" title="Synlighter v' + synlighterVersion + ' by Timur Kuzhagaliyev. Click for more info" /></a>');
        titleInfo.prepend('<div class="synlighter-title-info-button synlighter-title-info-button-raw" title="View raw in new window" onClick="$(this).synlighterRawSyntax(' + $(document).data('synlighter-increment-id') + ')" />');
        titleInfo.prepend('<div class="synlighter-title-info-button synlighter-title-info-button-copy" title="Copy to clipboard" />');
        if (warnings.length > 0) {
            var allErrors = "";
            $.each(warnings, function (index, currWarning) {
                allErrors += "Warning #" + (index + 1) + ": " + currWarning + "\n";
            });
            titleInfo.prepend('<div class="synlighter-title-info-button synlighter-title-info-button-warning" title="' + allErrors + '" />');
        }


        // Cripple the syntax
        var highlightedSyntax = originalSyntax;
        highlightedSyntax = highlightedSyntax.replace(/&/g, '<amprecend-amp>');
        highlightedSyntax = highlightedSyntax.replace(/#/g, '<amprecend-35>');
        highlightedSyntax = highlightedSyntax.replace(/:/g, '<amprecend-58>');
        highlightedSyntax = highlightedSyntax.replace(/;/g, '&#59;');
        highlightedSyntax = highlightedSyntax.replace(/<amprecend-35>/g, '&#35;');
        highlightedSyntax = highlightedSyntax.replace(/<amprecend-amp>/g, '&amp;');
        highlightedSyntax = highlightedSyntax.replace(/<amprecend-58>/g, '&#58;');
        highlightedSyntax = highlightedSyntax.replace(/</g, '&lt;');
        highlightedSyntax = highlightedSyntax.replace(/>/g, '&gt;');
        highlightedSyntax = highlightedSyntax.replace(/"/g, '&quot;');
        highlightedSyntax = highlightedSyntax.replace(/'/g, '&#39;');
        highlightedSyntax = highlightedSyntax.replace(/,/g, '&#44;');
        highlightedSyntax = highlightedSyntax.replace(/-/g, '&#45;');
        highlightedSyntax = highlightedSyntax.replace(/\//g, '&#47;');
        highlightedSyntax = highlightedSyntax.replace(/=/g, '&#61;');
        highlightedSyntax = highlightedSyntax.replace(/ /g, '&nbsp;');
        highlightedSyntax = highlightedSyntax.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');


        // Deal with new lines
        highlightedSyntax = highlightedSyntax.replace(/^(\n)*/, '');
        highlightedSyntax = highlightedSyntax.replace(/(\n)*$/, '');
        highlightedSyntax = highlightedSyntax.replace(/\n/g, '<br>');


        // Highlight each language
        if (lang == 'html') highlightedSyntax = highlightHTML(highlightedSyntax);
        if (lang == 'js') highlightedSyntax = highlightJS(highlightedSyntax);
        if (lang == 'jquery') highlightedSyntax = highlightJQUERY(highlightedSyntax);
        if (lang == 'css') highlightedSyntax = highlightCSS(highlightedSyntax);


        // Insert counter
        var linesArray = highlightedSyntax.split('<br>');
        var linesNum = linesArray.length;
        var linesHTML = '';
        var maxLength = 1;
        var currLine = 0;
        while (currLine < linesNum) {
            currLine++;
            maxLength = currLine.toString().length;
            if (settings.counter == 'alt') {
                if (currLine == 1 || currLine % 5 == 0) {
                    linesHTML += currLine + '<br>';
                } else {
                    linesHTML += '<br>';
                }
            } else {
                linesHTML += currLine + '<br>';
            }
        }
        container.append('<div class="synlighter-counter">' + linesHTML + '</div>');
        var syntaxPadding = 20;//maxLength * 10 + 36 + 10;

        // Display syntax
        container.append('<div class="synlighter-syntax synlighter-syntax-' + lang + '"><code class="synlighter-syntax-code" style="padding-right:16px;padding-left:' + syntaxPadding + 'px;"><pre class="synlighter-syntax-pre">' + highlightedSyntax + '</pre></code></div>');

        // Development callback
        settings.callback(highlightedSyntax);

        this.getSyntax = function () {
            return originalSyntax;
        }
    };
    $.fn.synlighterRawSyntax = function (id) {
        return this.each(function () {
            var element = $(this);
            var synlighter = element.data('synlighter');
            var w = window.open("Synlighter Syntax", "_blank", "width=750, height=400, location=0, resizable=1, menubar=0, scrollbars=0");
            w.document.write("<textarea style=\"width:99%;height:99%\">" + $(document).data('synlighter-syntax-' + id) + "</textarea>");
            w.document.close();
        });
    };
    $.fn.synlighter = function (options) {
        return this.each(function () {
            var element = $(this);

            // Return early if this element already has a plugin instance

            if (element.data('synlighter') instanceof Synlighter) {
                return;
            }

            // pass options to plugin constructor
            var synlighter = new Synlighter(this, options);

            // Store plugin object in this element's data
            element.data('synlighter', synlighter);
        });
    };
})(jQuery);