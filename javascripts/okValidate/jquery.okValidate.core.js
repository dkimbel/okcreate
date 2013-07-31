/**
 * jquery.okValidate 
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

(function($) {
  'use strict';

  // Serialize form fields into an object
  // "user[books][][name]", {user: {books: [{}]} } => {name: value: null }
  $.fn.serializeObject = function(value){
    var serialized = {},
        checkable  = /radio|checkbox/i;

    function serialize(path, value, obj) {
      var key, tmp;

      if (path.length){
        key = path.shift();

        if (key) { // Object or value
          obj[key] = serialize(path, value, obj[key] || {}); // Reuse the obj if it exists
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

    this.not('[type=button],[type=submit],[type=reset]').each(function(){
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

  // Validate an object with a rules object
  $.okValidate = function(object, rules, dfd, opts){
    var propertyQueue = [], propertyErrors = {}, errorCount = 0, currentProperty, currentPath;

    dfd = dfd || $.Deferred();

    opts = $.extend({
      // Simple string interpolation for generating error messagse. Parameters
      // are substituted by position:
      //
      // format("my balogna has {0} first {1}", ['a', 'name'])
      // #=> "my balogna has a first name"
      format: function( strOrFunction, params ) {
        var str = $.isFunction(strOrFunction) ? strOrFunction(params) : strOrFunction;

        $.each( params, function( i, n ) {
          str = str.replace( new RegExp("\\{" + i + "\\}", "g"), function() { return n; });
        });

        return str;
      }
    }, opts);

    // Take an object {foo: { bar: {required: true, min: 1}}}
    // and generate a new object {'foo,bar': {required: true, min: 1}}
    // We'll then use this to apply the rules to the same property in the object
    // { books: [{authors:{required: msg}}] }
    function keyRules(val, keys, rules){
      var rule, key;

      if ($.isPlainObject(val)) {
        for (var k in val) keyRules(val[k], keys.concat([k]), rules);
      } else {
        rule = keys.pop();
        key  = keys.join(',');
        if (!rules[key]) rules[key] = {};
        rules[key][rule] = val;
      }

      return rules;
    }

    // Drill down into the object and validate shared keys in the object and rules object
    function applyRules(object, keys, rules, error) { 
      var property = object, key;

      while(keys.length){
        key      = keys.shift();
        property = property[key];

        if (keys.length === 0) {
          validate(property, rules, key, error);
        } else if ($.isArray(property)) {
          if (!error[key]) error[key] = []; 

          for (var i=0; i < property.length; i++) {
            applyRules(property[i], keys.slice(0), rules, error[key][i]={});
          }

          return;
        } else {
          if (!property) break;

          error = error[key] = {};
        }
      }
    }

    // TODO Add specs for how these are merged
    function validate(value, rules, key, error) {
      $.when.apply($, $.map(rules, function(params, rule){
        var result;

        if (!$.okValidate.rules[rule]) throw "No such rule '"+rule+"'";

        params = $.makeArray(params);

        // Apply the rule
        result = $.okValidate.rules[rule].apply($.okValidate, [value, params]);
        result = result.promise ? result : { valid: result, rule: rule, params: params };

        propertyQueue.push(result);

        return result;
      }))
      .done(function(){
        var failed = {};

        $.each(arguments, function(i, result){
          if (!result.valid) {
            errorCount++;
            failed[result.rule] = opts.format(lookup(result), result.params);
          }
        });

        // Notify with value before combining errors
        error[key] = value;

        // Send the input and errors as separate objects before combining
        dfd.notify(currentProperty, failed);

        // Set the current property to the failing rules
        error[key] = failed;

        // Combine errors
        $.extend(true, propertyErrors, currentProperty);
      });
    }

    // Determine the error message for a given input and rule
    // user.name.required
    // required
    function lookup(result) {
      var msg = $.okValidate.messages;

      $.each(currentPath,function(i,v){
        if (msg[v]) {
          msg = msg[v];
        } else {
          msg = {};
          return false;
        }
      });

      return msg[result.rule] || $.okValidate.messages[result.rule];
    }

    $.each(keyRules(rules, [], {}),function(keystring, rules){
      currentProperty = {};
      currentPath     = keystring.split(',');
      applyRules(object, currentPath.slice(0), rules, currentProperty);
    });

    // When all validations are complete, resolve or reject the dfd
    // depending on whether there are errors
    $.when.apply($, propertyQueue).done(function(){ 
      dfd[errorCount ? 'reject' : 'resolve'](propertyErrors);
    });

    return dfd;
  };

  $.fn.okValidate = function(opts) {
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

      dfd.progress(function(input,errors){
        var nameAndValue = $.deserializeObject(input)[0],
            element      = $("[name='"+nameAndValue.name+"']");
            
        ui.after({ valid: $.isEmptyObject(errors), element: element, errors: errors }, opts);
      });

      ui.before({ element: element }, opts);

      $.okValidate(obj, rules, dfd, opts);

      return dfd;
    }

    return this.each(function(){
      var form   = $(this).attr( "novalidate", "novalidate" ),
          inputs = $(':input:not([type=hidden],[type=button],[type=submit],[type=reset])', form);

      // Bind optional events
      inputs.bind($.map(opts.events, function(v,k){ return k; }).join(' '), function(event){
        var input = $(this),
            check = opts.events[event.type],
            shouldValidate = check && ($.isFunction(check) ? opts.events[event.type](this, event) : check );

        if (shouldValidate) validate(input, input.serializeObject(), compileRules(input) );
      });

      // Submit event is implicit
      form.bind('submit',function(event){
        event.preventDefault();

        validate(form, inputs.serializeObject(), compileRules(inputs)).done(function(){ 
          opts.onSubmit(form[0], event); 
        });

        return false;
      });
    });
  };

})(jQuery);
