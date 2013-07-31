/**
 * jquery.textmetrics.js
 *
 * @description Determine the size of the font
 */
(function($) {
	"use strict";

 $.textMetrics = function(el) {
  var h = 0, w = 0, styles = ['font-size','font-style', 'font-weight', 'font-family','line-height', 'text-transform', 'letter-spacing'];

  var div = $("<div/>").appendTo("body").css({ position: 'absolute', left: -1000, top: -1000, display: 'none' }).html(el.html());

  $.each(styles,function(i,s) { div.css(s, el.css(s)); });

  h = div.outerHeight();
  w = div.outerWidth();

  div.remove();

  return { height: h, width: w };
 };

})(jQuery);
