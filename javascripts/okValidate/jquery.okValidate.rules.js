/**
 * jquery.okValidate.rules
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

  /**
  * Rules are pretty simple:
  *
  * A validator receives the element and the value of the element as an
  * argument and should return true or false depending on whether or not the
  * field is valid.
  *
  * Alternatively it can return a deferred. Which should resolveWith an error object:
  *
  *   dfd.resolve({ valid: BOOL, params: [], rule: RULENAME });
  *
  * See the 'remote' rule for an example
  * 
  */

  function filterNulls(value) { return $.grep(value,function(n){ return(n); }); }

  $.okValidate.rules = {

    // Required
    'required': function( value , params ) {
      return $.isArray(value) ? filterNulls(value).length : !!value && $.trim(value) !== '';
    },

    // Email
    'email' : function( value, params ){
      return (/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i).test(value);
    },

    // URL
    'url': function( value, params ){
      return (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i).test(value);
    },

    // Number
    'number': function( value, params ){
      return !isNaN(value);
    },

    // Poor man's typechecker. Mostly useful when using okValidate on an JS object rather than a form 
    // ".property" - duck typing
    // "type" - check if the input is a valid type
    'type': function(value, params){
      var valid = $.map(params, function(param,i){
        if (param[0] == ".") {
          return value[param.slice(1)];
        } else {
          try {
            return Object.prototype.toString.call(value).match(/^\[object\s(.*)\]$/)[1].toLowerCase() == param;
          } catch (e) {
            return typeof value == param;
          }
        }
      });

      return $.inArray(true, valid) > -1;
    },

    // Date - Validates if the value is either a valid dateString of number of milliseconds since the epoch.
    // Validate date strings:
    // 2010,
    // 2010-01,
    // 2010-01-01,
    // February 3, 2001,
    // February 3 2001,
    // 2010-06-09T15:20:00Z,
    // 2010-06-09T15:20:00-07:00,
    // 2010 June 9,
    // 6/9/2010 3:20 pm
    'date': function( value , params ) {
      return !/Invalid|NaN/.test(new Date(value).toString());
    },

    // Min - Validates if it is greater than or equal to the given param
    'min': function( value , params ) {
      return ($.isArray(value) ? filterNulls(value).length : value) >= params[0];
    },

    // Max - Validates if it is less than or equal to the given param
    'max': function( value , params ) {
      return ($.isArray(value) ? filterNulls(value).length : value) <= params[0];
    },

    // Range - Validates if the value is between two params, or exactly equal to a singular param
    'range': function( value , params ) {
      value = $.isArray(value) ? filterNulls(value).length : value;
      return params[1] ? value >= params[0] && value <= params[1] : value == params[0];
    },

    // Step - Validates if the value is within the given step. You can pass 'any' to validate for any step amount
    'step': function( value , params ) {
      return value == 'any' ? true : value % params[0] === 0;
    },

    // Pattern - Validates if The value matches the given pattern regexp
    'pattern': function( value , params ) {
      return (new RegExp(params[0])).test(value);
    },

    // Validates if the string or the number of array members length are greater than or equal to the param
    'minlength': function( value , params ) {
      var length = $.isArray( value ) ? filterNulls(value).length : $.trim(value).length;
      return length >= params[0];
    },

    // Validates if the string or the number of array members length are less than or equal to the param
    'maxlength': function( value , params ) {
      var length = $.isArray( value ) ? filterNulls(value).length : $.trim(value).length;
      return length <= params[0];
    },

    // Validates if the string or the number of array members length are either be between the two given params, or exactly equal if given one param
    'rangelength': function( value , params ) {
      var length = $.isArray( value ) ? filterNulls(value).length : $.trim(value).length;
      return params[1] ? length >= params[0] && length <= params[1] : value.length == params[0];
    },

    // Remote validation - Value should be the url to validate against. If the response from the server
    // is successful, validation passes, if not then validation fails.
    'remote': function( value , params ) {
      var dfd = $.Deferred(),
          req = $.ajax({url: params[0]});

      req
        .done(function(data){
          dfd.resolve({ valid: true, params: [], rule: 'remote' });
        })
        .error(function(resp, status, error){
          dfd.resolve({ valid: false, params: [], rule: 'remote' });
        });

      return dfd;
    }
  };

  /**
   * Messages correspond to the name of the rule used.
   * 
   * - Formatting is contingent on the formatter used, but by default it will
   *   accept a string and interpolate based the position of the paramter.  If
   *   given a function it will be first called with the number of parameters and
   *   should return a string to perform interpolation on.
   * 
   * - Display of messages is contingent on the UI used.
   *
   * - Message lookup path is based on input names
   *   Given the input:
   *   <input name='user[name]' required />
   *   okValidate will look in the following places on the $.okValidate.messages object
   *
   *   user.name.required
   *   required
   *   
   */
  $.okValidate.messages =  {
    'required'    : "This field is required.",
    'number'      : "Please enter a number",
    'type'        : 'Invalid type',
    'email'       : "Please enter a valid email address.",
    'url'         : "Please enter a valid URL.",
    'date'        : "Please enter a valid date.",
    'step'        : "Invalid step must be multiples of {0}.",
    'range'       : function(params){ return params[1] ? "Please enter a value between {0} and {1}." : "Must be a value of {0}"; },
    'max'         : "Please enter a value less than or equal to {0}.",
    'min'         : "Please enter a value greater than or equal to {0}.",
    'pattern'     : "Invalid format.",
    'maxlength'   : "Please enter no more than {0} characters.",
    'minlength'   : "Please enter at least {0} characters.",
    'rangelength' : function(params){ return params[1] ? "Please enter a value between {0} and {1} characters long." : "Please enter a value {0} characters long."; },
    'remote'      : "Please fix this field."
  };

  /**
   *
   * Identify rules to apply via selectors
   * {
   *   selector: {
   *     rule: String         // Required. Which rule this selector will trigger
   *     priority: Number     // Optional. Lower priority rules will run first, a block higher priority rules until they pass. Default priority is 1
   *     parameters: Function // Optional. See parsing below
   *   }
   * }
   * 
   * Parsing Parms
   * 
   * By default $.fn.okValidate uses the content of the attribute to generate
   * the arguments to the validator. The general rule is "Split the string by
   * commas, if it looks like a number it is, otherwise treat it as a string"
   * If you want to override this behavior, you can pass a function in as the
   * parameters option which should return a list of paramters. It receives the
   * input as the argument
   */
  $.okValidate.selectors = {
    '[required]'         : { rule: 'required',  priority: 0 },
    '[type=email]'       : { rule: 'email' },
    '[type=url]'         : { rule: 'url' },
    '[type=number]'      : { rule: 'number' },
    '[type=date]'        : { rule: 'date' },
    '[min]'              : { rule: 'min' },
    '[max]'              : { rule: 'max' },
    '[step]'             : { rule: 'step' },
    '[pattern]'          : { rule: 'pattern' },
    '[data-range]'       : { rule: 'range' },
    '[data-minlength]'   : { rule: 'minlength' },
    '[data-maxlength],[maxlength]' : { rule: 'maxlength' }, // maxlength is valid html5 property
    '[data-rangelength]' : { rule: 'rangelength' },
    '[data-remote]'      : { rule: 'remote'  }
  };

})(jQuery);
