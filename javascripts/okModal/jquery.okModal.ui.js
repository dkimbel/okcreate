/**
 * jquery.okModal.ui.js
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

  $.okModal.ui = {
    /**
     * Enhances the modal with gallery capabilities
     *
     * @method gallery
     * @param {Object} options Plugin Options
     *
     * By default a 'gallery' is inferred to be any item that matches the original selector
     * e.g. $("a.gallery-item"), all '.gallery-item' elements will be used to generate the items
     * for the current gallery. If you want to use a different set of items, provide an `items`
     * function option, which returns a jQuery object of gallery items
     */
    gallery: function(options) {
      var items = $.isFunction(options.items) ? options.items(this) : this.trigger;

      function moveTo(event, modal, backwards) {
        event.preventDefault();

        var idx   = modal.currentIndex || 0,
            items = modal.items;

        backwards ? idx-- : idx++;

        idx = idx < 0 ? items.length -1 : idx >= items.length ? 0 : idx;

        modal.currentIndex = idx;

        console.log(items.eq(idx));
        modal.open(items.eq(idx), true);
      }

      function next(e, modal){ moveTo(e, modal); }
      function prev(e, modal){ moveTo(e, modal, true); }

      return {
        template: "<div><div data-ui-content></div><nav><a class='ui-prev prev' href='#'>Previous</a><a class='ui-next next' href='#'>Next</a></nav></div>",
        onCreate: function(modal, options){
          this.items = items;
          modal.addClass('ui-gallery');
        },
        events: {
          'click element'            : 'open',
          'click modal .ui-close'    : 'close',
          'click #ui-overlay'        : 'close',
          'click .ui-modal .ui-next' : next,
          'click .ui-modal .ui-prev' : prev
        }
      };
    }
  };

})(jQuery);
