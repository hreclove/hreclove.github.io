(function(ext) {
    var collision = false; 
    var device = null;
    var rawData = null;
    
    var channels = {
        collision: 1,
        system: 0
    };
    
    var inputs = {
        collision: 1,
        system: 0
    };

    var colorTable = {
        'red': 1,
        'bright red': 2, 
        'yellow': 3, 
        'green': 4, 
        'bright blue': 5,
        'blue': 6, 
        'magenta': 7,
        'white': 8,
        'off' : 0
    };
    
    var dirTable = {
        'forward':1, 
        'backward': 2, 
        'left': 3, 
        'right': 4
    };

    // Hats / triggers
    ext.whenCollision = function (which) {
        return getSensorDetected(which);
    };

    // Private logic
    function getSensorDetected(which) {
        if (device == null) return false;
        if (which == 'collision') return true;
        return false;
    }

    function getSensor(which) {
        return inputs[which];
    }

    ext.roll = function(angle, speed) {
        // Code that gets executed when the block is run
        console.log('Rolling angle:'+angle+' speed:'+speed);

        if(!device) return;
        
        var rollCmd = new Uint8Array(3);
        rollCmd[0] = 2;
        rollCmd[1] = angle;
        rollCmd[2] = speed;
        device.send(rollCmd.buffer);

    };

    ext.rolld = function(dir, speed) {
        // Code that gets executed when the block is run
        console.log('Rolling2 dir:'+dir+'='+dirTable[dir]+' speed:'+speed);
        
        if(!device) return;
        
        var rolldCmd = new Uint8Array(3);
        rolldCmd[0] = 3;
        rolldCmd[1] = dirTable[dir];
        rolldCmd[2] = speed;
        device.send(rolldCmd.buffer);
    };

    ext.light = function(color) {
        // Code that gets executed when the block is run
        console.log('LED color:'+color+'='+colorTable[color]);

        if(!device) return;
                
        var ledCmd = new Uint8Array(3);
        ledCmd[0] = 3;
        ledCmd[1] = colorTable[color];
        ledCmd[2] = 0;  // TODO: mode
        device.send(ledCmd.buffer);
    };

    var inputArray = [];

    function processData() {
        var bytes = new Uint8Array(rawData);
        
        for (var i = 0; i < 5; ++i) {   // 5 channels
            var channel = bytes[i*2];            // channel number
            inputArray[channel] = bytes[i*2+1];  // status codes
        }

        if (watchdog) {
            clearTimeout(watchdog);
            watchdog = null;
        }

        for (var name in inputs) {
            var v = inputArray[channels[name]];
            inputs[name] = v;
        }

        console.log(inputs);
        rawData = null;
    }

    function appendBuffer(buffer1, buffer2) {
        var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;
    }

    // Extension API interactions
    var potentialDevices = [];
    ext._deviceConnected = function (dev) {
        potentialDevices.push(dev);

        if (!device) {
            tryNextDevice();
        }
    };

    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        device = potentialDevices.shift();

        if (device) {
            device.open({stopBits: 0, bitRate: 115200, ctsFlowControl: 0}, deviceOpened);
        }
    }

    var poller = null;
    var watchdog = null;

    function deviceOpened(dev) {
        if (!dev) {
            // Opening the port failed.
            tryNextDevice();
            return;
        }
        device.set_receive_handler(function (data) {
            console.log('Received: ' + data.byteLength);
            if (!rawData || rawData.byteLength == 10) {
                rawData = new Uint8Array(data);
            } else {
                rawData = appendBuffer(rawData, data);
            }

            if (rawData.byteLength >= 10) {
                //console.log(rawData);
                processData();
                //device.send(pingCmd.buffer);
            }
        });

        // Tell the SPRK to send a input data every 100ms
        var pingCmd = new Uint8Array(1);
        pingCmd[0] = 1;
        poller = setInterval(function () {
            device.send(pingCmd.buffer);
        }, 100);
        watchdog = setTimeout(function () {
            // This device didn't get good data in time, so give up on it. Clean up and then move on.
            // If we get good data then we'll terminate this watchdog.
            clearInterval(poller);
            poller = null;
            device.set_receive_handler(null);
            device.close();
            device = null;
            tryNextDevice();
        }, 1000);
    }

    ext._deviceRemoved = function (dev) {
        if (device != dev) return;
        if (poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function () {
        if (poller) poller = clearInterval(poller);
        if (device) device.close();
        device = null;
    };

    ext._getStatus = function () {
        if(!device) return {status: 1, msg: 'SPRK disconnected'};
        if(watchdog) return {status: 1, msg: 'Probing for SPRK'};
        return {status: 2, msg: 'SPRK connected'};
    };


    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            // Block type, block name, function name
            ['w', 'Roll with angle %n speed %n', 'roll', '0', '0'],
            ['w', 'Roll %m.direction speed %n', 'rolld', 'forward', '0'],
            ['w', 'LED %m.light', 'light', 'red', '0'],
            ['h', 'when collision detected', 'whenCollision', 'collision']
        ],
        menus: {
            direction: ['forward', 'backward', 'left', 'right'],
            light: ['red', 'bright red', 'yellow', 'green', 'bright blue', 'blue', 'magenta','white','off']
        },
        url: 'http://hreclove.github.io/extension'
    };

    // Register the extension
    ScratchExtensions.register('SPRK', descriptor, ext, {type: 'serial'});

})({});