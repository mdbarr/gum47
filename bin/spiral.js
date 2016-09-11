#!/usr/bin/env node

'use strict'

var _ = require('underscore');
var fs = require('fs');
var PNG = require('pngjs').PNG;


var minX = 0;
var minY = 0;
var maxX = 0;
var maxY = 0;

var points = { };

function plotPoint(x, y) {
  x = Math.round(x);
  y = Math.round(y);

  minX = Math.min(x, minX);
  minY = Math.min(y, minY);

  maxX = Math.max(x, maxX);
  maxY = Math.max(y, maxY);

  points[x + ',' + y] = true;

  //console.log('%s, %s', x, y);
}

////////////////////////////////////////////////////////////
// centerX-- X origin of the spiral.

// centerY-- Y origin of the spiral.

// radius--- Distance from origin to outer arm.

// coils---- Number of coils or full rotations. (Positive numbers spin clockwise, negative numbers spin counter-clockwise)

// rotation- Overall rotation of the spiral. ('0'=no rotation, '1'=360 degrees, '180/360'=180 degrees)

////////////////////////////////////////////////////////////

function spiralGenerator(centerX, centerY, radius, coils, rotation) {
  var thetaMax = coils * 2 * Math.PI;

  // How far to step away from center for each side.
  var awayStep = radius / thetaMax;

  // distance between points to plot
  var chord = 10;

  // For every side, step around and away from center.
  // start at the angle corresponding to a distance of chord
  // away from centre.
  for ( var theta = chord / awayStep; theta <= thetaMax; ) {
    //
    // How far away from center
    var away = awayStep * theta;
    //
    // How far around the center.
    var around = theta + rotation;
    //
    // Convert 'around' and 'away' to X and Y.
    var x = centerX + Math.cos ( around ) * away;
    var y = centerY + Math.sin ( around ) * away;
    //
    // Now that you know it, do it.
    plotPoint( x, y );

    // to a first approximation, the points are on a circle
    // so the angle between them is chord/radius
    //theta += chord / away;

    var delta = ( -2 * away + Math.sqrt ( 4 * away * away + 8 * awayStep * chord ) ) / ( 2 * awayStep );

    theta += delta;

    chord = _.random(6, 12);
  }
}

////////////////////////////////////////////////////////////

plotPoint(0, 0);

for (var i = 0; i < 12; i++) {
  spiralGenerator(0, 0, _.random(1000, 1250), _.random(0.5, 2), 360 * i);
}

////////////////////////////////////////////////////////////

minX -= 10;
minY -= 10;
maxX += 10;
maxY += 10;

var width = Math.abs(maxX - minX);
var height = Math.abs(maxY - minY);
var data = new Buffer(width * height * 4);
var count = 0;

console.log("%s, %s to %s, %s (%sx%s)", minY, minX, maxX, maxY, width, height);

var offset = 0;
for (var y = minY; y < maxY; y++) {

  for (var x = minX; x < maxX; x++) {
    if (points[x + ',' + y]) {
      data[offset] = 255;
      data[offset+1] = 255;
      data[offset+2] = 255;
      data[offset+3] = 255;
      count++;
    } else {
      data[offset] = 5;
      data[offset+1] = 5;
      data[offset+2] = 20;
      data[offset+3] = 255;
    }
    offset += 4;
  }
}

var png = new PNG();
png.width = width;
png.height = height;
png.data = data

png.pack().pipe(fs.createWriteStream('spiral.png'));
console.log('%s systems seeded.', count);
