/**
 * jquery.okStylize.ui.js
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
   * Wrap form elements in styleable tags and update inputs according to events
   *
   * setup: (Optional) called once to generate the replaced element. Defaults
   *        to an internal setup method which treats the element as an inline
   *        input (e.g. checkbox or radio)
   * selector: (Required) identifies which element should be replaced
   * update: called on bind event
   * bind: (Optional) specify an event that triggers an update. Defaults to click if omitted
   * name: (Optional) will be added to the replaced element's container as a className. Defaults to the key is omitted
   *
	 * @param jQuery el
	 * @param Object opts okStyleize options
	 * @param Object e Events to bind, properties are event names
   */
  $.okStylize.ui = {
    checkbox: {
      selector: ":checkbox",
      update: function(el,opts){
        el.closest('label')[el.is(':checked') ? 'addClass' : 'removeClass']('checked');
      }
    },
    radio: {
      selector: ":radio",
      update: function(el,opts){
        // Retrieve all the radios in this group
        var inputs   = $(":radio[name='"+el.attr('name')+"']"),
            selector = '.' + opts.className;

        inputs.not(":checked").each(function(){
          $(this).closest(selector).removeClass('checked');
        });

        el.closest(selector)[el.is(':checked') ? 'addClass' : 'removeClass']('checked');
      }
    },
    select: {
      setup: function(el,opts){
        return el.wrap("<div/>").parent().prepend("<span/>");
      },
      selector: "select:not('.enhanced')",
      bind: 'change',
      update: function(el,opts){
        var p    = el.parent(),
            span = p.find("span");

        span.html($(":selected", el).html());

        if (opts.selectAutoGrow) {
          span.width($.textMetrics(span).width + parseInt(span.css('paddingRight'),10));
        }
      }
    },
    file: {
      setup: function(el,opts){
        var html = "<span class='filename'></span><span class='action'>"+opts.fileButtonHtml+"</span>",
            p    = el.wrap("<div/>").parent().append(html);
        if (el.prop("size")) { el.prop("size", p.width() / 10); }

        return p;
      },
      selector: ":file",
      bind: 'change',
      update: function(el,opts){
        var filename  = el.val(),
            container = el.parent();

        if (filename === "") {
          filename = opts.fileDefaultHtml;
        } else {
          filename = filename.split(/[\/\\]+/);
          filename = filename[(filename.length - 1)];
        }

        container.find(".filename").text(filename);
      }
    }
  };

})(jQuery);
