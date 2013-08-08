/**
 * jquery.okValidate.ui
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under MIT and GPL.
 * http://www.opensource.org/licenses/mit-license.php
 * Date: 08/07/13
 *
 * @projectDescription Form and Object Validation
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($){
  'use strict';

  // Sorts the errors and returns the error with the lowest
  // priority
  function getErrorMessage(errors) {
    var msgs = $.map(errors, function(msg,k) { return [$.okValidate.selectors[k] || 1, msg]; })
                .sort(function(a,b){ return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0); });
    // $.map flattens arrays
    return $.map([msgs], function(v,i){ return v[1]; })[0] || opts.defaultMessage;
  }

  // The UI receives two lists: the list of valid inputs and the list of invalid inputs
  // Invalid inputs are tupples where the first item is the input, and the second a list of errors
  $.fn.okValidate.ui = {
  
    // The default UI 'inline' will append the messages after the field inline
    // a label with an error class If a message cannot be found it will use the
    // defaultMessage option
    // Before is called right before validation occurs, and after is called
    // immediately after validation occurs
    inline: {
      before: function(input, opts) {
        var element = input.element;

        element.addClass(opts.validatingClass);
      },
      after: function( input, opts ) {
        var element = input.element.eq(input.element.length-1),
            label   = $(opts.errorElement + '.' + opts.errorClass + "[for='"+element.attr('name')+"']"),
            msg;

        element.removeClass(opts.validatingClass);

        if (input.valid) {
          element.removeClass(opts.errorClass).addClass(opts.validClass); 

          label.hide();
        } else {
          element.removeClass(opts.validClass).addClass(opts.errorClass);

          msg = getErrorMessage(input.errors);

          if (label.length) {
            label.show().html(msg);
          } else {
            $("<"+opts.errorElement+"/>")
              .insertAfter(element.parent().is("label") ? element.parent() : element) // Checkboxes are often inside labels
              .addClass(opts.errorClass)
              .attr('for', element.attr('name'))
              .html(msg);
          }
        }
      }
    }
    // Inline
  };

})(jQuery);
