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

function barredSpiralGalaxy() {
  function spiralGenerator(centerX, centerY, radius, sides, coils, rotation) {
    var awayStep = radius/sides;
    var aroundStep = coils/sides;

    var aroundRadians = aroundStep * 2 * Math.PI;
    rotation *= 2 * Math.PI;
    for (var i = 1; i <= sides; i++){
      var away = i * awayStep;
      var around = i * aroundRadians + rotation;
      var x = centerX + Math.cos(around) * away;
      var y = centerY + Math.sin(around) * away;
      plotPoint(x, y);
    }

  }
  for (var x = -150; x <= 150; x+=2) {
    plotPoint(x, 0);
  }

  for (var y = -50; y <= 50; y+=2) {
    plotPoint(0, y);
  }

  spiralGenerator(150, 0, 1500, 250, 1, 0);
  spiralGenerator(150, 0, 1500, 250, 0.95, 0);

  spiralGenerator(-150, 0, 1500, 250, 1, 0.5);
  spiralGenerator(-150, 0, 1500, 250, 0.95, 0.5);
}

barredSpiralGalaxy();

if (0) {
  for (var i = 0; i < 12; i++) {
    spiralGenerator(0, 0,
                    _.random(1000, 1250),
                    500,
                    _.random(0.5, 2),
                    360 * i);
  }
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
