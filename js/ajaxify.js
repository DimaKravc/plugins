(function (window, $) {

    var
        History = window.History,
        document = window.document;

    // Check to see if History.js is enabled for our Browser
    if (!History.enabled) return false;

    // Internal Helper
    $.expr[':'].internal = function (obj, index, meta, stack) {
        // Prepare
        var $this = $(obj),
            url = $this.attr('href') || '',
            isInternalLink;

        // Check link
        isInternalLink = url.substring(0, History.getRootUrl().length) === History.getRootUrl() || url.indexOf(':') === -1;

        // Ignore or Keep
        return isInternalLink;
    };

    // HTML Helper
    var documentHtml = function (html) {
        return String(html).replace(/<\!DOCTYPE[^>]*>/i, '')
            .replace(/<(html|head|body|title|script)([\s\>])/gi, '<div id="document-$1"$2')
            .replace(/<\/(html|head|body|title|script)\>/gi, '</div>');
    };

    // Ajaxify Helper
    $.fn.ajaxify = function () {
        // Prepare
        var $this = $(this);

        // Ajaxify
        $this.find('a:internal:not(.no-ajaxy,[href^="#"],[href*="wp-login"],[href*="wp-admin"])').on('click', function (event) {
            // Prepare
            var
                $this = $(this),
                url = $this.attr('href'),
                title = $this.attr('title') || null;

            // Continue as normal for cmd clicks etc
            if (event.which == 2 || event.metaKey) return true;

            // Ajaxify this link
            History.pushState(null, title, url);
            event.preventDefault();
            return false;
        });
        // Chain
        return $this;
    };

    // Progress bar module
    var progressModule = {
        settings: {
            duration: 3000,
            color: '#00acc1',
            failedColor: '#ff0000',
            percent: 0
        },
        start: function () {
            if (!this.bar) {
                var barSelector = '.progress-bar';
                this.bar = $(barSelector).length ? $(barSelector) : $('<div class="progress-bar"></div>').appendTo('body')
            }
            if (this._timer) {
                clearInterval(this._timer);
                this.settings.percent = 0;
            }
            this.bar.css({
                'opacity': '1',
                'background-color': this.settings.color,
                'width': this.settings.percent
            });
            var cut = 10000 / Math.floor(this.settings.duration);
            this._timer = setInterval((function () {
                this.increase(cut * Math.random());
                if (this.settings.percent > 95) {
                    this.finish()
                }
            }).bind(this), 100)
        },
        increase: function (num) {
            this.settings.percent += Math.floor(num);
            this.bar.css({
                'width': this.settings.percent + '%'
            });
        },
        finish: function () {
            this.settings.percent = 100;
            this.bar.css({
                'width': this.settings.percent + '%'
            });
            this.hide();
        },
        hide: function () {
            clearInterval(this._timer);
            this._timer = null;
            this.settings.percent = 0;

            setTimeout((function () {
                this.bar.css({
                    'opacity': '0'
                });
                setTimeout((function () {
                    this.bar.css({
                        'width': '0'
                    });
                }).bind(this), 200)
            }).bind(this), 500)
        },
        fail: function () {
            this.bar.css({
                'background-color': this.settings.failedColor
            });
        }
    };

    // Ajax Request the Traditional Page
    var getPage = function (url, parts, callback) {
        $.ajax({
            url: url,
            success: function (data, textStatus, jqXHR) {
                // Prepare
                var $data = $(documentHtml(data)),
                    bodyClasses = $data.find('#document-body:first').attr('class');

                $('body').attr('class', bodyClasses);
                document.title = $data.find('#document-title:first').text();

                parts.each(function () {
                    var slug = this.dataset.ajaxify,
                        $twin = $data.find("#document-body:first [data-ajaxify='" + slug + "']");

                    if (!$twin.html())  return;

                    var $scripts = $twin.find('#document-script');
                    if ($scripts.length) $scripts.detach();

                    $("[data-ajaxify='" + slug + "']").html($twin.html())
                        .ajaxify()
                        .css({opacity: 1, visibility: "visible"});

                    // Add the scripts
                    $scripts.each(function () {
                        var scriptText = $(this).html();

                        if ('' != scriptText) {
                            var scriptNode = document.createElement('script');
                            scriptNode.appendChild(document.createTextNode(scriptText));
                            $("[data-ajaxify='" + slug + "']").append(scriptNode);
                        } else {
                            $.getScript($(this).attr('src'));
                        }
                    });
                });

                callback();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var notFoundURL = History.getRootUrl() + 'not-found/';

                History.pushState(null, 'Страница не найдена', notFoundURL);
                return false;
            }
        })
    };

    // Wait for Document
    $(function () {
        // Prepare Variables
        var $body = $(document.body),
            $partsArr = $('[data-ajaxify]');

        // Ajaxify our Internal Links
        $body.ajaxify();

        // Hook into State Changes
        $(window).bind('statechange', function () {
            // Prepare Variables
            var State = History.getState(),
                url = State.url;

            progressModule.start();

            // Set Loading
            $body.addClass('loading');

            // Start Fade Out
            // Animating to opacity to 0 still keeps the element's height intact
            // Which prevents that annoying pop bang issue when loading in new content
            $('[data-ajaxify-transition]').css({
                opacity: '0',
                visibility: 'hidden'
            });

            getPage(url, $partsArr, loaded);

            function loaded() {
                jQuery('html, body').stop().animate({
                    scrollTop: 0
                }, 750);

                progressModule.finish();

                $body.removeClass('loading');

                // Reinitialization page scripts
                Application.init(Application.widgets)
            }
        }); // end onStateChange
    }); // end onDomLoad

})(window, jQuery); // end closure