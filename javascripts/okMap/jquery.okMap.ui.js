/**
 * jquery.okMap.core.js
 *
 * Copyright (c) 2014 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 02/21/14
 *
 * @description Convience wrapper for Google Maps
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */
(function($){

  okMap.prototype.infoPane = function(options){
    var args = Array.prototype.slice.call( arguments, 1 );
    if ( typeof options === 'string' ) {
      this._infoPane[options].apply( this._infoPane, args );
    }
    return this._infoPane || (this._infoPane = new InfoPane(options));
  };

  function InfoPane(options) {
    var ip = this;
    this.options  = options;
    this.selector = options.selector || ".infoPane";
    this.element  = options.template ? $(options.template) : $(this.selector).first().clone().detach().show();

    this.element.on('click.okMap', "[data-close]", function(e){
      e.preventDefault();
      ip.close();
    });
  }

  // OverlayView Implementation

  InfoPane.prototype = new google.maps.OverlayView();

  InfoPane.prototype.onAdd = function() {
    if (this.element.length) {
      this.getPanes().floatPane.appendChild(this.element[0]);
    }
  };

  InfoPane.prototype.draw = function() {
    var point = this.getProjection().fromLatLngToDivPixel(this.latLng);

    if (point) {
      this.element[0].style.left = point.x + 'px';
      this.element[0].style.top  = point.y + 'px';
    }
  };

  InfoPane.prototype.getPosition = function() {
    return this.latLng;
  };

  InfoPane.prototype.onRemove = function() {
    this.element.hide();
  };

  // API Methods

  InfoPane.prototype.open = function(place, event){
    var marker = place.marker;

    this.close();
    this.setMap(place.marker.getMap());
    this.latLng  = place.marker.getPosition();

    if (this.element.length) {
      this.element.show();
      if (this.options.render) this.options.render(this.element,place,event);
    } else if (console) {
      console.log("No infoPane element exists");
    }
  };

  InfoPane.prototype.close = function(){
    this.setMap(null);
  };

  InfoPane.prototype.destroy = function(){
    this.close();
    $(this.element).off('click.okMap');
    this.element = null;
  };

})(jQuery);
