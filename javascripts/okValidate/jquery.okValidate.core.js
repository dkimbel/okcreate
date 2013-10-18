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

})(jQuery);
