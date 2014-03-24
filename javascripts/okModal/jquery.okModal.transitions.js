/**
 * jquery.okModal.transitions.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 12/08/13
 *
 * @description For popups, modal windows, tooltips etc.
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($) {
  "use strict";

  // Delegate .transition() calls to .animate()
  // if the browser can't do CSS transitions.
  if (!$.support.transition)
    $.fn.transition = $.fn.animate;

  /**
   * @method onCreate (optional) called once with the modal and options during plugin initialization
   * @method onOpen   (required) called when the openWhen event is triggered, or modal.open is called
   *                  You can attach callbacks to the ui promise to trigger them
   *                  after the content is loaded. It receives the final dimensions as an
   *                   argument
   * @method onClose  (required) called when the closeWhen event is triggered, or modal.close is called
   *                  The transition should be resolved when the onClose method is done.
   */
  $.okModal.transitions = {
    fade: {
      onOpen: function(modal, options){
        modal.stop(true, true).show().css({ scale: options.scale || 0.7, opacity: 0 }).transition({ scale: 1, opacity: 1 });
      },
      onClose: function(modal, options){
        modal.stop(true, true).transition({ opacity:0, scale: options.scale || 0.7 },function(){ modal.hide(); });
      }
    },

    slide: {
      onOpen: function(modal, options){
        var that = this,
            dir  = options.direction || 'top',
            hor  = $.inArray(dir,['left','right']) > -1,
            css = { opacity: 0 };

        css[hor ? 'x' : 'y'] = ($.inArray(dir, ['top','left']) > -1 ? "-" : "") + "90%";

        modal.show().css(css);

        modal.stop(true, true).transition({ y: 0, x: 0, opacity: 1},function(){
          that.contentContainer().transition({ opacity:1 });
        });
      },
      onClose: function(modal, options){
        var dir = options.direction || 'top',
            hor = $.inArray(dir,['left','right']) > -1,
            css = { opacity: 0 };

        css[hor ? 'x' : 'y'] = ($.inArray(dir, ['top','left']) > -1 ? "-" : "") + "90%";

        modal.stop(true, true).transition(css, function(){ modal.hide(); });
      }
    },

    flip: {
      onOpen: function(modal, options){
        var css = {opacity: 0};
        css[options.vertical ? 'rotateX' : 'rotateY' ] = -70;
        modal.css(css).show();

        modal.stop(true, true).transition({ rotateX: 0, rotateY: 0, opacity: 1 });
      },
      onClose: function(modal, options){
        var css = {opacity: 0};
        css[options.vertical ? 'rotateX' : 'rotateY' ] = -70;
        modal.stop(true, true).transition(css, 'fast', function(){ modal.hide(); });
      }
    }

  };

})(jQuery);
