/**
 * jquery.okStylize.core.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 10/28/13
 *
 * @description Lightweight plugin purely for styling unstyleable form
 * elements: checkboxes, radios, selects and file inputs, although it can be
 * extended to work on any type of element
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0BETA
 */
(function($){
	"use strict";

  $.okStylize = function(el,opts) {
    opts = $.extend({
      addClassStates : true,               // Whether or not replaced elements will get additional UI information on hover, active, focus, blur etc.
			disabledClass  : "disabled",         // Class added to the container when the input is disabled
			activeClass    : "active",           // Class added to the container when the input is disabled
			focusClass     : "focus",            // Class added to the container when the input is focused
			hoverClass     : "hover",            // Class added to the container when the input is hovered over
			selectedClass  : "selected",         // Class selected options
			className      : "styled",           // Class added to the containing element for all all replaced inputs
			fileButtonHtml : "Choose File",      // Text used for the file input's button
			fileDefaultHtml: "No file selected", // Text used for an file input without a selected file
      selectAutoGrow : !!$.textMetrics,    // Autogrow the select if the textMetrics plugin is available
      namespace      : ".okStylize"        // Event namespace
    }, opts);

    var selector = [],           // All selectors
        eventMap = {};           // Map our events to a list of selectors

    if (!$.okStylize.ui) throw "No UI elements defined";

    /*
     * Parse our ui generators - set defaults and gather selectors
     */
    $.each($.okStylize.ui,function(name,o){
      var bind = o.bind || 'click';

      selector.push(o.selector);

      if (!o.name)  o.name  = name;
      if (!o.setup) o.setup = setup;

      if (o.bind === false) return;

      if (eventMap[bind]) {
        eventMap[bind].push(o.selector);
      } else {
        eventMap[bind] = [o.selector];
      }
    });

    /*
     * Enable/Disable a given input and it's wrapper
     */
    $.okStylize.setEnabled = function(el,enabled) {
      el.prop('disabled', !enabled).closest('.'+opts.className)[enabled ? 'removeClass' : 'addClass'](opts.disabledClass);
    };

    selector = selector.join(",");

    /*
     * Return the UI with a selector that matches the element
     */
    function uiFor(el) {
      var ui;

      $.each($.okStylize.ui, function(k,v){
        if (el.is(v.selector)) {
          ui = $.okStylize.ui[k];
          return false;
        }
      });

      return ui;
    }

    /*
     * Default setup if UI doesn't provide one. 
     * Appropriate for inline elements (radio,checkbox) that
     * are expected to be wrapped in label tags;
     */
    function setup(el,opts) {
      el.wrap("<span/><span></span></span>");
      return el.closest('label');
    }

    el.andSelf().find(selector).each(function(){
      var el      = $(this),
          ui      = uiFor(el),
          classes = [opts.className, ui.className || ui.name];

      if (ui) {
        if (el.is(':disabled')) classes.push(opts.disabledClass);

        ui.setup(el,opts).addClass(classes.join(' '));
        ui.update(el,opts);
      }
    });

    /*
     * Bind Interface Events
     */
    $.each(eventMap,function(event, selector){
      $("body").on(event + opts.namespace, selector.join(','), function(e) {
        var el = $(this),
            ui = uiFor(el);
        if (ui && !el.is(":disabled")) ui.update(el,opts,e);
      });
    });
    
    /**
     * Bind the hover, active, focus, and blur UI updates
     */
    if (opts.addClassStates) {
      // TODO Need to bind in NS
      $("." + opts.className).on({
        focus: function (){
          $(this).addClass(opts.focusClass);
        },
        blur: function (){
          $(this).removeClass(opts.focusClass + ' ' + opts.activeClass);
        },
        mouseenter: function (){
          $(this).addClass(opts.hoverClass);
        },
        mouseleave: function (){
          $(this).removeClass(opts.hoverClass);
        },
        "mousedown touchbegin": function () {
          if (!$(this).find(selector).is(":disabled")) {
            $(this).addClass(opts.activeClass);
          }
        },
        "mouseup touchend": function() {
          $(this).removeClass(opts.activeClass);
        }
      });
    }
  };

  $.fn.okStylize = function(opts){
    $.okStylize(this,opts);
    return this;
  };

})(jQuery);
