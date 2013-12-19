/**
 * jquery.okValidate.ui
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under MIT and GPL.
 * http://www.opensource.org/licenses/mit-license.php
 * Date: 12/12/13
 *
 * @projectDescription Form and Object Validation
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($){
  'use strict';

  var inputSelector = ':input:not([type=hidden],[type=button],[type=submit],[type=reset])';

  $.fn.okValidate = function() {
    var args = Array.prototype.slice.call( arguments ),
        opts = args.length == 2 ? args[1] : args[0],
        validateNow = args[0] === true;

    opts = $.extend(true,{
      ui              : 'inline',     // UI used for displaying error messages
      validatingClass : "validating", // Class added to input while it is being validated
      errorClass      : "error",      // Class added to input when it fails validation
      validClass      : "valid",      // Class added to input when it passes validation
      errorElement    : "label",      // Element used by the UI to append errors
      defaultMessage  : "Please fix this field", // Default error message
      // Determine whether or not a an event should trigger validations
      // Can be a boolean to always/never trigger or a function which
      // returns a boolean. 
      events          : {
        keyup         : false,
        focusout      : true
      },
      onSubmit        : function(form){ form.submit(); } // Called when a form is valid and the form submitted
    }, opts);


    // Gather the rules from the form via selectors
    // Parse a given input name like "user[tags][]" into an object like { user:
    // {tags: RULES } } based on the selectors it matches
    function compileRules(inputs){
      var i = inputs.length, rules = {}, inputRules = {}, input, rule;

      function add(input,rules) {
        var obj  = {},
            path = $.grep(input.name.replace(/\]/g, "").split(/\[/),function(v){ return $.trim(v) !== ""; }),
            tmp  = obj,
            key;

        while(path.length){
          key = path.shift();
          tmp = tmp[key] = path.length ? {} : rules;
        }

        return obj;
      }

      while(i--) {
        input      = inputs.eq(i);
        inputRules = {};

        for (var selector in $.okValidate.selectors) {
          if (input.is(selector)) {
            rule   = $.okValidate.selectors[selector];
            // If our rule has a parameters function, run it otherwise just parse the values
            inputRules[rule.rule] = rule.parameters ? rule.parameters(input) : parseParams(input,selector);
          }
        }

        if (!$.isEmptyObject(inputRules)) {
          $.extend(true, rules, add(input[0], inputRules));
        }
      }

      return rules;
    }

    // Extract parameters from input attributes 
    // Treat comma-separated values as a parameter list - if it looks like a
    // digit, coerce it, otherwise leave it alone
    function parseParams(input, selector) {
      return (input.attr(selector.replace(/[\[\]]/g,'').split("=")[0]) || "")
        .split(/\s*,\s*/)
        .map(function(v,i){ return (/[\d\.]+$/).test(v) ? parseFloat(v, 10) : v; });
    }

    // Tie the UI into the validation process
    // Radios and checkboxes are validated as a group
    function validate(element, obj, rules) {
      var dfd = $.Deferred(),
          ui  = $.fn.okValidate.ui[opts.ui];

      if (!ui) throw "No such ui '"+ui+"'";

      dfd.progress(function(input, errors){
        var nameAndValue = $.deserializeObject(input)[0],
            element      = $("[name='"+nameAndValue.name+"']");

        ui.after({ valid: $.isEmptyObject(errors), element: element, errors: errors }, opts);
      });

      ui.before({ element: element }, opts);

      $.okValidate(obj, rules, dfd, opts);

      return dfd;
    }

    if (validateNow) {
      var inputs = this.is("form") ? $(inputSelector, this) : this.filter(inputSelector);
      return validate(this, inputs.serializeObject(), compileRules(inputs));
    } else {
      return this.each(function(){
        var form   = $(this).attr( "novalidate", "novalidate" ),
            inputs = $(inputSelector, form);

        // Bind optional events
        inputs.bind($.map(opts.events, function(v,k){ return k; }).join(' '), function(event){
          var input = $("[name='"+this.name+"']"),
              check = opts.events[event.type],
              shouldValidate = check &&
                ($.isFunction(check) ? opts.events[event.type](this, event) : check );

          if (shouldValidate) validate(input, input.serializeObject(), compileRules(input) );
        });

        // Submit event is implicit
        form.bind('submit',function(event){
          event.preventDefault();

          validate(form, inputs.serializeObject(), compileRules(inputs))
          .done(function(){
            opts.onSubmit(form[0], event);
          });

          return false;
        });
      });
    }
  };

  // Serialize form fields into an object
  $.fn.serializeObject = function(value){
    var serialized = {},
        checkable  = /radio|checkbox/i;

    function serialize(path, value, obj) {
      var key, tmp;

      if (path.length){
        key = path.shift();

        if (key) { // Object or value
          // Reuse the obj if it exists, and don't overwrite existing values
          // with null values (can occur when validating radios)
          if ((tmp = serialize(path, value, obj[key] || {})) !== null) {
            obj[key] = tmp || obj[key];
          }
          return obj;
        } else { // Blank string = some type of an array
          if (path.length) { // Still more to go, therefore must be an array with objects
            key = path.shift();
            tmp = {};

            if (obj.push) { // Array exists
              // Rails decides to start accumulating values in a new hash
              // whenever it encounters an input name that already exists in the
              // current hash.
              if (obj[obj.length-1][key]) {
                tmp[key] = serialize(path, value, {});
                obj.push(tmp);
              } else {
                obj[obj.length-1][key] = serialize(path, value, {});
              }

              return obj;
            } else {
              tmp[key] = serialize(path, value, {});
              return [tmp];
            }
          } else { // Plain Array
            if (obj.push) {
              obj.push(value);
              return obj;
            } else {
              return [value];
            }
          }
        }
      } else {
        return value;
      }
    }

    this.filter(inputSelector).each(function(){
      serialize(
        this.name.replace(/\]/g, "").split(/\[/),
        value || (checkable.test(this.type) && !this.checked ? null : this.value),
        serialized
      );
    });

    return serialized;
  };

  // http://guides.rubyonrails.org/form_helpers.html#understanding-parameter-naming-conventions
  // Given an object returns what would be the correseponding name attribute for an input
  $.deserializeObject = function(obj){
    var param = $.param(obj).replace(/%5B/g,'[').replace(/%5D/g,']');
    return $.map(param.split('&'),function(v,i){
      var chunks = v.split('=');
      return {name: chunks[0].replace(/\[\d+\]/g,'[]'), value:chunks[1]};
    });
  };

  /*
   * The UI receives two lists: the list of valid inputs and the list of
   * invalid inputs. Invalid inputs are tupples where the first item is the
   * input, and the second a list of errors
   */
  var ui = $.fn.okValidate.ui = {
    // Helper function - Sorts the errors and returns the error with the lowest priority
    getErrorMessage: function(errors) {
      var msgs = [];
      $.each(errors, function(type,msg) {
        var r;
        $.each($.okValidate.selectors, function(k,v){ if (v.rule == type) { r = v; return false; } });
        msgs.push([r.priority === undefined ? 1 : r.priority, msg]);
      });
      msgs = msgs.sort(function(a,b){  return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0); });
      return msgs[0] ? msgs[0][1] : opts.defaultMessage;
    },

    /*
     * The default UI 'inline' will append the messages after the field inline
     * a label with an error class If a message cannot be found it will use the
     * defaultMessage option

     * Before is called right before validation occurs, and after is called
     * immediately after validation occurs
     */
    inline: {
      before: function(input, opts) {
        var element = input.element;

        element.addClass(opts.validatingClass);
      },
      after: function( input, opts ) {
        var element = input.element.eq(input.element.length-1),
            label   = $(opts.errorElement + '.' + opts.errorClass + "[for='"+element.attr('name')+"']"),
            after,
            msg;

        element.removeClass(opts.validatingClass);

        if (input.valid) {
          element.removeClass(opts.errorClass).addClass(opts.validClass);

          label.hide();
        } else {
          element.removeClass(opts.validClass).addClass(opts.errorClass);

          msg = ui.getErrorMessage(input.errors);

          if (label.length) {
            label.show().html(msg);
          } else {
            after = element.parents().filter("label:last"); // Checkboxes are often inside labels
            if (after.length === 0) after = element;

            $("<"+opts.errorElement+"/>")
              .insertAfter(after)
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
