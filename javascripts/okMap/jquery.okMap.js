/**
 * jquery.okNav.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
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

  function okMap(el, opts){
    this.element   = el;
    this.places    = {};
    this.bounds    = new google.maps.LatLngBounds();
    this.currentId = 0;
    this.options   = $.extend(true, {
      events     : {},      // Specify marker events globally in event, handler pairs. Events can be one of 'click', 'dblclick', 'mouseup', 'mousedown', 'mouseover', 'mouseout'.
                            // Note that the default behavior can be overriden on a per-marker basis by passing in an events object for the given marker
      scope      : window,  // Object that event methods will be called on. Probably should not leave this as window - globals are bad mmkay?
      autoFit    : true,    // Resize to fit when places are added or removed
      keepZoom   : true,    // Used in conjunction with autoFit. Will keep current zoom level if the markers are already visible, otherwise will zoom to fit
      maxZoom    : 15,      // Used in conjunction with autoFit. If during autofit the map zooms in too far, it will be set to this level.
      places     : [],      // Initial list of places
      whiney     : true,    // Whether or not failing geocoding logs the error
      mapOptions : {        // Map options passed directly to the gmap instance
        zoom      : 8,
        center    : new google.maps.LatLng(37.757687,-122.437477), // SF - WOOT WOOT
        mapTypeId : google.maps.MapTypeId.ROADMAP
      }
    }, $(el).data(opts.dataAttribute || 'map'), opts); // data attribute of inlined json that can be used as options when initializing okMap

    this.map = new google.maps.Map(this.element, this.options.mapOptions);
    this.set(this.options.places);
  }

  function bindEvents(scope, place) {
    $.each(place.events,function(event, fn){
      if (fn && scope[fn]) {
        google.maps.event.addListener(place.marker, event, function(event) {
          scope[fn](place, event);
        });
      }
    });
  }

  function removeEvents(place) {
    $.each(place.events,function(event, fn){
      google.maps.event.clearListeners(place.marker, event);
    });
  }

  $.extend(okMap.prototype,{
    // Set the current set of places. Removes any existing places
    // Can either take multiple places as an argument list or an array of places
    set: function(){
      this.remove();
      this.bounds = new google.maps.LatLngBounds();
      this.append(makeArray(Array.prototype.slice.call( arguments, 0 )));
    },

    // Add one or more places
    // Can either take multiple places as an argument list or an array of places
    append: function(){
      var self = this, dfds = [];

      $.each(makeArray(Array.prototype.slice.call( arguments, 0 )), function(i, p){
        var dfd = self.setLatLng(p);

        dfd.done(function(place){
          place._id    = 'p'+self.currentId++;
          place.marker = new google.maps.Marker($.extend({},place,{ position: place.latLng, map: self.map }));
          place.events = place.events || self.options.events;

          bindEvents(self.options.scope, place);

          self.bounds.extend(place.marker.getPosition());
          self.places[place._id] = place;
        });

        dfds.push(dfd);
      });

      $.when.apply($,dfds).done(function(){
        if (self.options.autoFit) self.fit();
        $(self.element).trigger("ready.okMap");
      });
    },

    // Remove one or more places. 
    // Can either take multiple places as an argument list or an array of places
    // Called without args, removes all places
    remove: function(){
      var self     = this,
          toRemove = makeArray(Array.prototype.slice.call( arguments, 0 )),
          rmFn     = function(_,p){
            if (p.sticky) return;
            removeEvents(p);
            p.marker.setMap(null);
            delete self.places[p._id];
          };

      if (toRemove.length) {
        $.each(toRemove, function(i, p){
          var place = typeof p == "string" ? self.places[p] : p;

          if (place) {
            rmFn(i, place);
          } else if (self.options.whiney) {
            console.log("No such place with id: '"+p+"'");
          }
          
        });
      } else {
        $.each(this.places, rmFn);
      }
    },

    // Use a filter function to reduce the places set
    // Handy if you want to remove a subset of places from the map
    filter: function(filterFn){
      return $.grep($.makeArray(this.places), filterFn);
    },

    // Remove all places within a boundary
    removeWithin: function(sw, ne){
      var self = this;

      $.each(App.places, function(_id, place) {
        var pos = place.marker.getPosition();

        if (!(sw.lat() < pos.lat() && pos.lat() < ne.lat() && sw.lng() < pos.lng() && pos.lng() < ne.lng())) {
          self.remove(place);
        }
      });
    },

    // Remove all places that aren't currently visible on the map.
    // Defaults to the bounds of the map, but you could pass your own
    // bounds object in, if you'd like for some crazy reason.
    removeHidden: function(bounds){
      bounds = bounds || this.map.getBounds();

      this.removeWithin(bounds.getSouthWest(), bounds.getNorthEast());
    },

    // Set a Google Map compatible latLng object based on either the places lat
    // and lng properties or attempt to geocode the address. 
    // @return Deferred
    setLatLng: function(place){
      var self = this,
          dfd  = $.Deferred();

      if (place.lat && place.lng) {
        place.latLng = new google.maps.LatLng(place.lat, place.lng);
        dfd.resolve(place);
      } else if (place.address) {
        (new google.maps.Geocoder()).geocode({ address: place.address }, function(r,s) {
          if (s === google.maps.GeocoderStatus.OK) {
            place.latLng = r[0].geometry.location;
            dfd.resolve(place);
          } else {
            if (self.options.whiney) console.log("Unable to geocode '"+place.address+"'. Status: " + s);
            dfd.reject(s);
          }
        });
      }

      return dfd;
    },

    // Ensure all places are visible
    fit: function(){
      var self = this;

      if (!this.options.keepZoom) {
        // http://stackoverflow.com/questions/4523023/using-setzoom-after-using-fitbounds-with-google-maps-api-v3
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', function(event) {
          if (this.getZoom() > self.options.maxZoom) this.setZoom(self.options.maxZoom);
        });
      }

      this.map.fitBounds(this.bounds);
    },

    // Center a map without zooming. Takes either a LatLng object or two Floats or an object with lat/lng properties
    center: function(lat, lng){
      if ($.isPlainObject(lat)) {
        lng = lat.lng;
        lat = lat.lat;
      }

      this.map.setCenter(lat && lng ? new google.maps.LatLng(lat, lng) : lat);
    }
  });

  $.fn.okMap = function(opts){
    if ( typeof opts === 'string' ) {
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function(){
        var instance = $.data( this, 'okMap' );

        if ( !instance ) {
          console.log( "cannot call methods on okMap prior to initialization; " + "attempted to call method '" + opts + "'" );
          return;
        }
        if ( !$.isFunction( instance[opts] ) || opts.charAt(0) === "_" ) {
          console.log( "no such method '" + opts + "' for okMap instance" );
          return;
        }
        // apply method
        instance[ opts ].apply( instance, args );
      });

    } else {
      this.each(function() {
        var instance = $.data( this, 'okMap' );
        if ( instance ) {
          // apply options & init
          instance.option( opts );
        } else {
          // initialize new instance
          $.data( this, 'okMap', new okMap( this, opts ) );
        }
      });
    }

    return this;
  };

  function makeArray(args) {
    return args[0] instanceof Array ? args[0] : args;
  }

})(jQuery);