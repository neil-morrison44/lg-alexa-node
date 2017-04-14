"use strict";

const START_PORT = 11000;
const ip = require("ip");
const FauxMo = require("fauxmojs");
const config = require("./config.json");
const wol = require("node-wol");

if (config.tvMAC === null){
  console.error("Error: Enter your LG TV's MAC address into config.json!");
  return;
}

function turnOn(onComplete) {
  wol.wake(config.tvMAC, function(error) {
    if (error) {
      console.log("failed to turn on TV");
    } else {
      if (onComplete) {
        whenActive(onComplete);
      }
    }
  });
}

function isTVOn(){
  const lgtv = require("lgtv2")({url: 'ws://lgwebostv:3000'});
}

function whenActive(doFunc){
  const lgtv = require("lgtv2")({
    url: 'ws://lgwebostv:3000'
  });
  lgtv.on("connect", function() {
    lgtv.subscribe("ssap://com.webos.applicationManager/getForegroundAppInfo", function(err, res){
      if (res.appId.length > 0){
        doFunc();
        lgtv.disconnect();
      }
    });
  });
}

function turnOff() {
  const lgtv = require("lgtv2")({
    url: 'ws://lgwebostv:3000'
  });

  lgtv.on("connect", function() {
    console.log('connected');
    lgtv.request('ssap://system/turnOff', function(err, res) {
      lgtv.disconnect();
    });

  });
}

function launchApp(appId) {
  const lgtv = require("lgtv2")({
    url: 'ws://lgwebostv:3000'
  });

  lgtv.on('connect', function() {
    console.log("launching app", appId);
    lgtv.request('ssap://system.launcher/launch', {
      id: appId
    }, function(err, res) {
      console.log(err, res);
      lgtv.disconnect();
    });
  });
}

function closeApp(appId) {
  const lgtv = require("lgtv2")({
    url: 'ws://lgwebostv:3000'
  });

  lgtv.on('connect', function() {
    console.log('connected');
    lgtv.request('ssap://system.launcher/close', {
      id: appId
    }, function(err, res) {
      console.log(err, res);
      lgtv.disconnect();
    });
  });
}

function devicesList() {
  let devices = [];

  devices.push({
    name: "tv",
    port: START_PORT,
    handler: (action) => {
      console.log("tv action:", action);
      if (action == "on") {
        turnOn();
      } else {
        turnOff();
      }
    }
  });

  config.apps.forEach(function(app, index) {
      devices.push({
          name: app.name,
          port: START_PORT + index + 1,
          handler: (action) => {
            turnOn(function() {
              if (action == "on") {
                launchApp(app.id);
              } else {
                closeApp(app.id);
              }
            });
          }
      });
  });

return devices;
}

let fauxMo = new FauxMo({
  ipAddress: ip.address(),
  devices: devicesList()
});

console.log('started..');