/**
 * jquery.okStylize.ui.extra.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 10/28/13
 *
 * @description Provides UI elements for okStylize.
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0BETA
 */
(function($){
	"use strict";
  /** 
   * Fully replace the select dropdown, rather than reuse the native dropdown
   * Dependencies: jquery.okPosition.js
   */
  $.extend($.okStylize.ui, {
    enhancedSelect: {
      setup: function(el,opts){
        if (el.attr('multiple')) return el;

        var wrapped = el.wrap("<div/>").parent().prepend("<span class='label'/>"),
            ul      = $("<ul/>").prependTo(wrapped).css({position: 'absolute'});

        el.hide();

        $('option', el).each(function (i) {
          ul.append($('<li><a href="#" data-index="' + i + '">' + $(this).html() + '</a></li>'));
        });

        ul
        .css({ position: 'absolute', width: el.outerWidth() })
        .data('naturalHeight', parseInt(ul.css('height'), 10)).hide();

        $("body").on("click"+opts.namespace, function(e){
          var clicked     = $(e.target),
              interesting = $.inArray(wrapped[0], clicked.parents().andSelf()) > -1,
              open        = ul.is(":visible"),
              disabled    = el.is(":disabled"),
              prevIndex;

          if (interesting) {
            e.preventDefault();

            if (!open && !disabled) {
              ul.positionAt({
                relativeTo   : wrapped,
                position     : { x: 'center', y: 'bottom' },
                registration : { x: 'center', y: 'top' }
              });

              $.okStylize.ui.enhancedSelect.show(ul);

              wrapped.addClass(opts.activeClass);
            }

            if (clicked.is('a')) {
              $("a."+opts.selectedClass,ul).removeClass(opts.selectedClass);

              prevIndex           = el[0].selectedIndex;
              el[0].selectedIndex = clicked.addClass(opts.selectedClass).data('index');

              if (prevIndex != el[0].selectedIndex) el.trigger('change');

              ul.hide();
            }
          } else {
            ul.hide();
            wrapped.removeClass(opts.activeClass);
          }
        });

        return wrapped;
      },
      selector: "select.enhanced",
      className: 'select',
      bind: 'change',
      show: function(ul){
        var height = ul.show().data('naturalHeight'),
            space  = $('body').height() - ul.offset().top ;

        ul.hide();

        if (space < height) height = space;

        return ul.css({ height: height }).slideDown('fast');
      },
      update: function(el,opts){
        var p    = el.parent(),
            span = $(".label", p);

        span.html($(":selected", el).html());

        if (opts.selectAutoGrow) {
          span.width($.textMetrics(span).width + parseInt(span.css('paddingRight'),10));
        }
      }
    }
  });

})(jQuery);
