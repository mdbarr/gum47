#!/usr/bin/env node

////////////////////////////////////////////////////////////
// Gum 47

'use strict'

var _ = require('underscore');
var fs = require('fs');
var PNG = require('pngjs').PNG;

var PLANETARY_DISTANCE = 4;
var CLUSTER_STRENGTH = 0.9;
var SYSTEM_COUNT = 1000000;
var BOUNDARY = 10000;
var BOUNDARY_ = -1 * BOUNDARY;

var BLACKHOLE_RADIUS = 30;

var INITIAL_POS = 800; //Math.max(SYSTEM_COUNT * 0.001, 40);

////////////////////////////////////////////////////////////
// Generators
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(d) {
  for (var c = d.length - 1; c > 0; c--) {
    var b = Math.floor(Math.random() * (c + 1));
    var a = d[c];
    d[c] = d[b];
    d[b] = a;
  }
  return d
}

function inCircle(center_x, center_y, radius, x, y) {
  var dist = Math.pow(center_x - x, 2) + Math.pow(center_y - y, 2);
  return dist <= Math.pow(radius, 2);
}

var SYLLABLES = ["a", "ab", "ad", "af", "ag", "ah", "ak", "al", "am", "an", "ang", "ap", "ar", "as", "ash", "at", "ath", "av", "aw", "ay", "az", "ba", "be", "bi", "bla", "ble", "bli", "blo", "blu", "bo", "bra", "bre", "bri", "bro", "bru", "bu", "ce", "cla", "cle", "cli", "clo", "clu", "cra", "cro", "cru", "da", "de", "di", "do", "dra", "dre", "dri", "dro", "dru", "du", "e", "eb", "ed", "ef", "eg", "eh", "ek", "el", "em", "en", "eng", "ep", "er", "es", "esh", "et", "eth", "ev", "ew", "ey", "ez", "fa", "fe", "fi", "fla", "fle", "fli", "flo", "flu", "fo", "fra", "fre", "fri", "fro", "fru", "fu", "ga", "ge", "gi", "gla", "gle", "gli", "glo", "glu", "go", "gra", "gre", "gri", "gro", "gru", "gu", "ha", "he", "hi", "ho", "hu", "i", "ib", "id", "if", "ig", "ih", "ik", "il", "im", "in", "ing", "ip", "ir", "is", "ish", "it", "ith", "iv", "iw", "iy", "iz", "ka", "ke", "ki", "kla", "kle", "kli", "klo", "klu", "ko", "kra", "kre", "kri", "kro", "kru", "ku", "la", "le", "li", "lo", "lu", "ly", "ma", "me", "mi", "mo", "mu", "na", "ne", "ni", "no", "nu", "o", "ob", "od", "of", "og", "oh", "ok", "ol", "om", "on", "ong", "op", "or", "os", "osh", "ot", "oth", "ov", "ow", "oy", "oz", "pa", "pe", "pi", "pla", "ple", "pli", "plo", "plu", "po", "pra", "pre", "pri", "pro", "pru", "pu", "ra", "re", "ri", "ro", "ru", "sa", "se", "sha", "she", "shi", "sho", "shu", "si", "sla", "sle", "sli", "slo", "slu", "so", "su", "ta", "te", "tha", "the", "thi", "tho", "thra", "thre", "thri", "thro", "thru", "thu", "thy", "ti", "to", "tra", "tre", "tri", "tro", "tru", "tu", "u", "ub", "ud", "uf", "ug", "uh", "uk", "ul", "um", "un", "ung", "up", "ur", "us", "ush", "ut", "uth", "uv", "uw", "uy", "uz", "va", "ve", "vi", "vla", "vle", "vli", "vlo", "vlu", "vo", "vra", "vre", "vri", "vro", "vru", "vu", "wa", "we", "wi", "wo", "wra", "wre", "wri", "wro", "wru", "wu", "ya", "ye", "yi", "yl", "yo", "yth", "yu", "za", "ze", "zi", "zla", "zle", "zli", "zlo", "zlu", "zo", "zra", "zre", "zri", "zro", "zru", "zu"];

var NAME_HASH = { };

function generateWord(length) {
  var syllableCount = length || random(2, 7);

  var word = '';
  for (var i = 0; i < syllableCount; i++) {
    word += SYLLABLES[random(0, SYLLABLES.length - 1)];
  }
  word = word.charAt(0).toUpperCase() + word.slice(1);

  return word;
}

function generateName() {
  var clash = true;
  var name;


  while (clash)  {

    name = generateWord(); //+ ' ' + generateWord();

    clash = (NAME_HASH[name]) ? true : false;

    if(clash) {
      //console.log('CLASH', name);
    }
  }
  NAME_HASH[name] = true;
  //console.log(name);
  return name;
}

var STELLAR_TYPES = [ { class: 'O', size: 'giant', occurrence: 0.0000003 },
                      { class: 'B', size: 'giant', occurrence: 0.00125 },
                      { class: 'A', size: 'normal', occurrence: 0.00625},
                      { class: 'F', size: 'normal', occurrence: 0.0303 },
                      { class: 'G', size: 'normal', occurrence: 0.075 },
                      { class: 'K', size: 'normal', occurrence: 0.12, },
                      { class: 'M', size: 'giant', occurrence: 0.76 } ];

var STELLAR_COLORS = { 'O': [ 50, 50, 255 ],
                       'B': [ 100, 100, 255 ],
                       'A': [ 100, 100, 255 ],
                       'F': [ 255, 255, 255 ],
                       'G': [ 255, 255, 200 ],
                       'K': [ 255, 187, 153 ],
                       'M': [ 200, 0, 0 ] };

function stellarGenerator() {
  var accuracy = 10000000;
  var type = random(0, accuracy);
  var index = STELLAR_TYPES.length - 1;

  for (var i = 0, perc = 0; i < STELLAR_TYPES.length; i++) {
    perc += Math.ceil(accuracy * STELLAR_TYPES[i].occurrence);
    if (type < perc) {
      index = i;
      break;
    }
  }

  var stellarClass = STELLAR_TYPES[index].class;

  var sun = {
    class: stellarClass,
    size: STELLAR_TYPES[index].size,
    color: STELLAR_COLORS[stellarClass]
  };
  return sun;
}

var PLANET_NUMERALS = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X' ];

function planetGenerator(system, index) {
  var planet = {
    name: system.name + ' ' + PLANET_NUMERALS[index]
  };

  return planet;
}

function systemGenerator(x, y) {
  var system = {
    name: generateName(),
    sun: stellarGenerator(),
    planets: [],
    position: {
      x: x,
      y: y
    }
  };

  var planetCount = random(1, 10);
  for (var i = 0; i < planetCount; i++) {
    system.planets.push(planetGenerator(system, i));
  }
  return system;
}

////////////////////////////////////////////////////////////

function Universe() {
  var self = this;

  self.systems = [];
  self.positions = {};

  function setPosition(x, y, system) {
    self.positions[x + ',' + y] = system;
  }

  function getPosition(x, y) {
    return self.positions[x + ',' + y];
  }

  function safePosition(x, y) {
    if (x > BOUNDARY || x < BOUNDARY_) {
      return false;
    }

    if (y > BOUNDARY || y < BOUNDARY_) {
      return false;
    }

    if (Math.abs(x) < BLACKHOLE_RADIUS && Math.abs(y) < BLACKHOLE_RADIUS &&
        inCircle(0, 0, BLACKHOLE_RADIUS, x, y)) {
      return false;
    }
    /*
    if ((x > -50 && x < 50) && (y > -50 && y < 50)) {
      return false;
    }
    */
    return true;
  }

  var initialX = INITIAL_POS;//random(BOUNDARY_, BOUNDARY);
  var initialY = INITIAL_POS;//random(BOUNDARY_, BOUNDARY);
  var initial = systemGenerator(initialX, initialY);

  var printPercentages = [ 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 ];

  console.log(initialX, initialY);

  self.systems.push(initial);
  setPosition(initialX, initialY, initial);

  self.minX = 0;
  self.minY = 0;
  self.maxX = 0;
  self.maxY = 0;

  var clusterCount = Math.floor(Math.pow(PLANETARY_DISTANCE * 2, 2) * CLUSTER_STRENGTH);

  process.stdout.write('\nGenerating universe');

  var possibilities = self.systems.slice(0);

  for (var i = 0; i < SYSTEM_COUNT; i++) {
    var distace = random(1, PLANETARY_DISTANCE);
    var index = random(0, possibilities.length - 1);
    var neighbor = possibilities[index];

    if (!neighbor) {
      console.log('FAULT', index, possibilities.length);
    }

    var candidates = [];

    var cornerX = neighbor.position.x - PLANETARY_DISTANCE;
    var cornerY = neighbor.position.y - PLANETARY_DISTANCE;
    var dist = PLANETARY_DISTANCE * 2;

    for (var x = cornerX; x < (cornerX + dist); x++) {
      for (var y = cornerY; y < (cornerY + dist); y++) {
        if (safePosition(x,y) && !getPosition(x, y)) {
          candidates.push({
            x: x,
            y: y
          })
        }

      }
    }
    //console.log(candidates);

    //candidates = candidates.sort();
    //candidates = shuffleArray(candidates);

    if (candidates.length < clusterCount) {
      i--;
      possibilities.splice(index, 1);
    } else {
      var position = candidates[random(0, candidates.length - 1)];
      var newSystem = systemGenerator(position.x, position.y);
      setPosition(position.x, position.y, newSystem);
      self.systems.push(newSystem);

      possibilities.push(newSystem);

      //console.log(newSystem);

      self.minX = Math.min(self.minX, position.x);
      self.minY = Math.min(self.minY, position.y);
      self.maxX = Math.max(self.maxX, position.x);
      self.maxY = Math.max(self.maxY, position.y);

      if (i % 100 === 0) {
        process.stdout.write('\u001b[36m.\u001b[0m');
      }

      for (var p = 0; p < printPercentages.length; p++) {
        if (i === Math.floor((SYSTEM_COUNT - 1) * printPercentages[p])) {
          process.stdout.write((printPercentages[p] * 100) + '%');
          break;
        }
      }
    }

  }
  process.stdout.write('\n');
}

////////////////////////////////////////////////////////////

var universe = new Universe();
var width = Math.abs(universe.maxX - universe.minX);
var height = Math.abs(universe.maxY - universe.minY);
var data = new Buffer(width * height * 4);

console.log("%s, %s to %s, %s (%sx%s)", universe.minY, universe.minX, universe.maxX, universe.maxY, width, height);

var offset = 0;
for (var y = universe.minY; y < universe.maxY; y++) {

  for (var x = universe.minX; x < universe.maxX; x++) {
    var system = universe.positions[x + ',' + y];
    if (system) {
      //process.stdout.write('#');

      data[offset] = system.sun.color[0];
      data[offset+1] = system.sun.color[1];
      data[offset+2] = system.sun.color[2];
      data[offset+3] = 255;
    } else {
      //process.stdout.write(' ');

      data[offset] = 0;
      data[offset+1] = 0;
      data[offset+2] = 0;
      data[offset+3] = 255;
    }
    offset += 4;
  }
  //process.stdout.write('\n');
}

var png = new PNG();
png.width = width;
png.height = height;
png.data = data

png.pack().pipe(fs.createWriteStream('universe.png'));
