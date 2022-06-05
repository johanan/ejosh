---
id: 694
title: 'Node.js, Socket.io, and Redis: Intermediate Tutorial – Client side'
date: '2015-02-01T23:43:25-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=694'
permalink: /2015/02/node-js-socket-io-and-redis-intermediate-tutorial-client-side/
dsq_thread_id:
    - '3674265200'
categories:
    - Javascript
tags:
    - node.js
    - react
    - socket.io
---

<div class="action-button">[Download](https://github.com/johanan/Where-to-eat) the src(github)</div><div class="action-button">[View](http://thawing-cliffs-6040.herokuapp.com/) the demo</div>#### Blog Post Series

<div class="action-button">[Server side covering node.js, Express, Socket.IO, Redis, and testing](http://ejosh.co/de/2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/)</div><div class="action-button">[Client side covering React and testing React](http://ejosh.co/de/2015/02/node-js-socket-io-and-redis-intermediate-tutorial-react/)</div>We will begin by managing our dependencies. Let’s get started.

## Bower

[Bower](http://bower.io/) is a package manager like npm. In much the same way as npm, Bower needs Node.js and runs on top of it. While npm focuses on packages for Node.js, Bower usually targets front-end libraries like jQuery and React. Managing front-end libraries is much better than the old way of just downloading a version and sticking it in our project. We now have full version control.

Bower uses a configuration file named bower.json. Here is that file for our project.

```json
{
  "name": "Where-to-eat",
  "version": "0.8.0",
  "homepage": "https://github.com/johanan/Where-to-eat",
  "authors": [
    "Joshua Johanan"
  ],
  "license": "MIT",
  "private": true,
  "dependencies": {
    "react": "0.12.2",
    "jquery": "2.1.3",
    "leaflet": "0.7.3"
  }
}
```

Bower then installs all the downloaded libraries to the folder bower\_components. All the dependencies can be downloaded by running bower install, which will retrieve them all.

This project relies on three libraries/frameworks. The first is React which we will cover in depth in the next article, jQuery which needs no introduction, and [Leaflet](http://leafletjs.com/) which is one of the best map libraries for JavaScript. Now that we have all of our dependencies we can put them all together.

## Grunt to manage our build

[Grunt](<http://gruntjs.com/ target=>) is a task runner that runs on top of Node.js. This means we can automate some things like [linting](http://stackoverflow.com/questions/8503559/what-is-linting) which should help discover errors early. It is a framework in which many plugins exist. For our project we will use it to concatenate our JavaScript, lint it, and then minify it. First we will look at how to setup Grunt.

### Gruntfile.js

This is the configuration file for what task Grunt will run and how.

```js
module.exports = function(grunt) {
  grunt.initConfig(
  //a config object is here with all of the tasks
  );
  
// These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task.
  grunt.registerTask('default', ['concat', 'jshint', 'uglify']);

};
```

This is just the shell as almost all of the configuration is in `grunt.initConfig`. We load each module and then register a task which will run certain modules. We will look at concat and jshint. The other configurations are in the repo if needed and they are, for the most part, the default.

```js
grunt.initConfig({
    concat: {
      dist: {
        src: ['js_src/react_components.js', 'js_src/joshNS.js'],
        dest: 'static/js/<%= pkg.name %>.js'
      },
      frameworks: {
        src:  ['bower_components/jquery/dist/jquery.js', 'bower_components/leaflet/dist/leaflet-src.js',
        'bower_components/react/react.js', 'js_utils/bootstrap-tab.js', 'js_utils/md5.js'],
        dest: 'static/js/frameworks.js'
      },
      reactAddons: {
        src: ['bower_components/react/react-with-addons.js'],
        dest: 'static/js/react-withaddons.js'
      },
      css:{
        //this is kind of cheating as I only need one file
        src:  ['bower_components/leaflet/dist/leaflet.css'],
        dest: 'static/css/leaflet.css'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          $: true,
          jQuery: true,
          window: true,
          document: true,
          md5: true,
          io: true,
          navigator: true,
          location: true,
          React: true
        }
      },
      all: ['<%= concat.dist.dest %>']
    }
  });
```

First thing to notice about concat is that it has four different targets. The first is our application code which is JavaScript that we wrote and not part of any frameworks. Next we bundle up all the JavaScript we did not write. This includes all of our libraries and frameworks (from their respective bower\_components folders) and a couple of utility scripts. The next two just move a script and css to the static folder so they can be used. The important takeaway from this is that we can keep our code in easy to digest files and then concatenate it all together later.

Next we run jshint which will lint our code and let us know if there are any issues. The list of options may change depending on how our project is setup. This brings us to the all property. This tells grunt which files to lint. Here we are taking the output of our `concat.dist.dest` property, which will be our concatenated file with our code.

## Socket.IO

In the [previous post](http://ejosh.co/de/2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/) we built the Socket.IO server side so we have a list of events that we have to listen for. The great thing about Socket.IO is that the client side is just as easy as the server side. The same three basic actions are there, `connect`, `on`, and `emit`. The basic idea is that one side emits to the on event of the other side. Socket.IO will keep track of the connection for us.

In our application listening for socket events is what the `Josh.Socket` object is for. This is wrapped in an [Immediately-Invoked Function Expression (IIFE)](http://benalman.com/news/2010/11/immediately-invoked-function-expression/). Here is the code for `Josh.Socket` in the `js_src/joshNS.js` file.

```js
(function (Josh, $) {
  "use strict";
  var sock,
    listeners = [];

  Josh.Socket = function (socket) {
    return init(socket);
  };

  var init = function (socket) {
    //DI
    sock = socket;

    var addEvent = function (name, obj) {
      var proxy = function (d) {
        $(obj).trigger(name, d);
      };
      sock.on(name, proxy);
      listeners.push({name: name, func: proxy});
    };

    var addUser = function (username, area, cb) {
      sock.emit('add', username, area, function () {
        cb();
      });
    };

    var addVote = function (fs) {
      //make a copy of the object to send to the server
      //we only need basic info as the rest will be
      //built client side
      var fsSend = $.extend(true, {}, fs);
      //delete what we don't need
      delete fsSend.marker;
      delete fsSend.user;
      sock.emit('addVote', fsSend);
    };

    var getUsers = function () {
      sock.emit('get');
    };

    var getVotes = function () {
      sock.emit('getVotes');
    };

    var removeListeners = function () {
      for (var i = 0; i < listeners.length; i++) {
        sock.removeListener(listeners[i].name, listeners[i].func);
      }
    };

    return {
      addEvent: addEvent,
      addUser: addUser,
      addVote: addVote,
      getUsers: getUsers,
      getVotes: getVotes,
      removeListeners: removeListeners
    };
  };
})(window.Josh = window.Josh || {}, window.jQuery);
```

The actual Socket.IO connection will be injected into this function. This will be important later when we test this object. All of the emits for our application are in this object. `addUser`, `addVote`, `getUsers`, and `getVotes` all emit events to the server. This brings up the question, what listens for the return events?

That would be the `addEvent` function. It implements a simplified observer pattern. We use this pattern because the Socket object does not have a list of all the functions that need to be executed when an event occurs. So other objects can use this function to say, ‘Hey when the vote event happens let me know!’. The implementation of `addEvent` takes the name of an event and the object that needs to be notified. It stores the reference of an anonymous function that triggers the same event name on the object and adds a listener to Socket.IO. The reference to the function is kept, so that we can remove the listener if needed. Here is how it is used:

```js
    socket.addEvent('serverError', this);

    $(this).on('serverError', function (e, d) {
      this.addAlert(d.message);
    });
```

When Socket.IO receives the serverError event it will execute the proxy function will trigger the serverError event on the object that called addEvent. One function can be used in many different ways.

## Leaflet Map

[Leaflet](http://leafletjs.com/) is an awesome map library. We can easily add icons using coordinates. We will only look at a few of the functions as the `Josh.Map` object is large and most of it is holding references to elements and listening for events. The `Josh.Map` object is too monolithic for my tastes, but I have not rewrote it yet. We will quickly look at the functions required to initialize a Leaflet map, add map tiles, center it, and add layers.

### Initializing the map and tiles

The first thing we must do is initialize the map and the tiles. Tiles are the actual images of the map. The provider of these images will usually have multiple layers of zoom for each tile. We are using tiles from [Stamen Design](http://maps.stamen.com/) and specifically the toner-lite tiles. We will need to include the Stamen library:

```html
<script type="text/javascript" src="http://maps.stamen.com/js/tile.stamen.js?v1.2.4"></script>
```

This will allow us to to add the tile layer:

```js
Josh.Map = function (id) {
  var stamen;
  //other code
  stamen = new L.StamenTileLayer("toner-lite");
  //more code
  this.map = new L.Map(id, {zoomAnimation: true});
  this.map.addLayer(stamen);
  //even more code
};
```

The id passed in is the id of the element that the map will be in. `L` is the Leaflet object and the Stamen script adds the function `StamenTileLayer`. Now that we have a map we can center it.

```js
//asking for the location inside of the init 
    navigator.geolocation.getCurrentPosition(function (location) {
      This.centerLoc(location);
    }, locError, {timeout: 10000});

//the centerLoc function
    centerLoc: function (loc) {
      this.location = loc;
      var hull = new L.LatLng(this.location.coords.latitude, this.location.coords.longitude);
      this.map.setView(hull, 13);
    },
```

We ask for the location using `navigator.geolocation.getCurrentPosition`. We then take the location object that is returned and pass it to our `centerLoc` function which will center the map using Leaflet’s `LatLng` and then calling `setView` with that object and the zoom level.

### Icons, Markers, and Layers

Each restaurant will have it’s own icon based on data from Foursquare. We will then use that icon with a marker that we can put into a layer, that will finally be added to the map. We will look over the functions that add and remove icons and layers.

The first thing we must do if we want our own customized icons is to extend the built-int Leaflet icon.

```js
    var RestIcon;
    //code
    RestIcon = L.Icon.extend({
      options: {
        shadowUrl: null,
        iconSize: new L.Point(32, 32)
      }
    });
```

This allows us later to create our own icons to add them to the map. Now let’s see how to add it to a layer.

```js
    addMarker: function (fs, layeradd) {
      layeradd = typeof layeradd !== 'undefined' ? layeradd : true;

      var icon;
      if (fs.categories.length > 0) {
        icon = new RestIcon({iconUrl: fs.categories[0].icon.prefix + 'bg_32' + fs.categories[0].icon.suffix});
      } else {
        icon = new L.Icon({iconUrl: 'images/marker.png'});
      }

      var markerLocation = new L.LatLng(fs.location.lat, fs.location.lng);
      var marker = new L.Marker(markerLocation, {icon: icon, title: fs.name});
      marker.fsid = fs.id;
      marker.img = icon.iconUrl;
      marker.on('click', this.showRestProxy.bind(this));
      if (layeradd) {
        this.map.addLayer(marker);
      }

      return marker;
    }
```

Here we take a FourSquare object, `fs`, and an optional layer group, `layeradd` and create a marker. A marker needs an icon, which we build from the category in the FourSquare object or use the default. Next a marker needs a `LatLng` object. Then we add a click event to the marker itself. Leaflet captures the events inside of the map element and does not bubble them up so we have to add the event here. We can then finally create and return the marker. If an optional layer group was passed in we add it to the group. We can now add a marker or the layer group to the map. Here is the function to do that.

```js
    addSearchLayer: function (rests) {
      if (this.searchLayer !== null) {
        //remove all the current restaurants
        this.removeLayer(this.searchLayer);
      }
      this.searchLayer = new L.LayerGroup();

      for (var id in rests) {
        this.addSearchFs(rests[id]);
        var marker = this.addMarker(rests[id], false);
        this.searchLayer.addLayer(marker);
      }

      this.map.addLayer(this.searchLayer);

    }
```

Here we are building a `LayerGroup` to hold all the markers from the FourSquare search. The markers are added to the `LayerGroup` so that they can be added and removed together. Finally here is how to remove the layer and marker.

```js
    removeLayer: function (arg) {
      if (arg.getLayers !== undefined) {
        var layers = arg.getLayers();
        for (var i = 0; i < layers.length; i++) {
          this.removeMarker(layers[i]);
        }
      }
      this.map.removeLayer(arg);
    },

    removeMarker: function removeMarker(marker) {
      marker.clearAllEventListeners();
    }
```

`removeLayer` checks to see if the layer has child layers. If so, then go over each of those layers and remove the markers. It does this by calling `removeMarker` which makes sure that the event listener is removed. This is important as this could create a huge memory leak. The final step is to remove the layer from the map.

We have quickly went over how to add and remove our own markers to a Leaflet map. All of these functions are off of a controller like object which keeps references to the map and map layers.

## Searching for Restaurants

I have mentioned FourSquare a few times and by now you should guess that we use the FourSquare API. We [previously](http://ejosh.co/de/?p=692) built a proxy to the API in Node.js. Here is the function for calling that proxy.

```js
    findRests: function (query) {
      if (query !== '') {
        query = encodeURI(query);
      } else {
        query = encodeURI('restaurant');
      }

      var foursquare = $.getJSON('/foursquare?lat=' + this.location.coords.latitude + '&lon=' + this.location.coords.longitude + '&query=' + query);

      foursquare.done(function (data) {
        var rests = data.response.venues;
        this.addSearchLayer(rests);
      }.bind(this));
    }
```

This codes uses the convenience jQuery function `getJSON` to get the JSON from our proxy. A [promise](https://www.promisejs.org/) like object is returned (jQuery calls it a [Deferred object](http://api.jquery.com/category/deferred-object/)) and we execute a function when the JSON is returned. We use the bind function to make sure that `this` is our `Josh.Map` object and not the `window`. When we use an anonymous function it is executed in the context of the `window` and not the object we are currently in. `Bind` allows us to change what `this` is in the function. It is a powerful feature of JavaScript and I definitely recommend [Secrets of the JavaScript Ninja](http://www.amazon.com/gp/product/193398869X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=193398869X&linkCode=as2&tag=ejoblo-20&linkId=5LYWEKJH47Z27YWY) which covers this and much, much more.

## Handling Votes

The server holds what each user’s vote currently is, but the client side has the running total. Each time a vote comes in it could be a new user with a new restaurant, a new user with a current restaurant, a current user with a new restaurant, or a current user with a current restaurant. We will use the `Josh.Votes` object to manage all of this. Here is the initial function to create the object.

```js
  Josh.Votes = function () {
    this.votes = {};
    this.users = {};
  };
```

We are using two objects to work like hash maps. `votes` will hold the FourSquare object of each restaurant with the FourSquare ID as the key. `users` will store the FourSquare ID of the restaurant with the username as the key. Next we will look at how to add a vote.

```js
    addVote: function (vote) {
      var userVote = this.findByUser(vote.user[0].username);

      if (userVote !== undefined) {
        var fsVote = this.findByFs(userVote);

        fsVote.user = this.removeFromArray(vote.user[0].username, fsVote.user);
      }

      this.users[vote.user[0].username] = vote.id;

      var newVote = this.findByFs(vote.id);
      if (newVote === undefined) {
        this.votes[vote.id] = vote;
        newVote = vote;
      } else {
        newVote.user.push(vote.user[0]);
      }

      this.cleanUpRestaurants();
    }
```

This function takes a vote that was received from Socket.IO. It should be a FourSquare object with an additional property of user that holds which user made the vote. We then have to work through the previous votes we have and compute what the current vote tally should be. First thing we do is find the current vote for the user. If we have a vote for this user we find the previous vote and remove the user from it. We now have a constant state whether or not a user has voted already. This is important so that we can take the same steps through the rest of the function and reach the same state. We then tie the vote to the user and add the add the user to the array of users that voted for the restaurant. The final call to `cleanUpRestaurants` will go through the `votes` object and trigger an event to remove the icon from the map.

## Summary

In this part we have added front-end dependency management with Bower. This allows us to completely control what versions of frameworks our application relies on. Then we looked at how to automate important steps in building our application. This includes concatenating, linting, and minimizing our JavaScript code. Finally we wrapped up looking at Socket.IO, searching for restaurants, and voting. In the next part we look at building the view with React.