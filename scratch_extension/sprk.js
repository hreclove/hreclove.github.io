(function(ext) {
	  var collision = false; 
	


    ext.roll = function(angle, speed) {
        // Code that gets executed when the block is run
        console.log('Rolling'+angle+speed);
        
    };

    ext.roll2 = function(dir, speed) {
        // Code that gets executed when the block is run
        console.log('Rolling2'+dir+speed);
        
    };

    ext.light = function(color) {
        // Code that gets executed when the block is run
        console.log('LED Light'+color);
        
    };

    var inputArray = [];

    function processData() {
        var bytes = new Uint8Array(rawData);

        inputArray[15] = 0;

        // TODO: make this robust against misaligned packets.
        // Right now there's no guarantee that our 18 bytes start at the beginning of a message.
        // Maybe we should treat the data as a stream of 2-byte packets instead of 18-byte packets.
        // That way we could just check the high bit of each byte to verify that we're aligned.
        for (var i = 0; i < 9; ++i) {
            var hb = bytes[i * 2] & 127;
            var channel = hb >> 3;
            var lb = bytes[i * 2 + 1] & 127;
            inputArray[channel] = ((hb & 7) << 7) + lb;
        }

        if (watchdog && (inputArray[15] == 0x04)) {
            // Seems to be a valid PicoBoard.
            clearTimeout(watchdog);
            watchdog = null;
        }

        for (var name in inputs) {
            var v = inputArray[channels[name]];
            if (name == 'light') {
                v = (v < 25) ? 100 - v : Math.round((1023 - v) * (75 / 998));
            }
            else if (name == 'sound') {
                //empirically tested noise sensor floor
                v = Math.max(0, v - 18);
                v = (v < 50) ? v / 2 :
                    //noise ceiling
                25 + Math.min(75, Math.round((v - 50) * (75 / 580)));
            }
            else {
                v = (100 * v) / 1023;
            }

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
            device.open({stopBits: 0, bitRate: 38400, ctsFlowControl: 0}, deviceOpened);
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
            if (!rawData || rawData.byteLength == 18) {
                rawData = new Uint8Array(data);
            } else {
                rawData = appendBuffer(rawData, data);
            }

            if (rawData.byteLength >= 18) {
                //console.log(rawData);
                processData();
                //device.send(pingCmd.buffer);
            }
        });

        // Tell the PicoBoard to send a input data every 50ms
        var pingCmd = new Uint8Array(1);
        pingCmd[0] = 1;
        poller = setInterval(function () {
            device.send(pingCmd.buffer);
        }, 50);
        watchdog = setTimeout(function () {
            // This device didn't get good data in time, so give up on it. Clean up and then move on.
            // If we get good data then we'll terminate this watchdog.
            clearInterval(poller);
            poller = null;
            device.set_receive_handler(null);
            device.close();
            device = null;
            tryNextDevice();
        }, 250);
    }

    ext._deviceRemoved = function (dev) {
        if (device != dev) return;
        if (poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function () {
        if (device) device.close();
        if (poller) poller = clearInterval(poller);
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
            ['w', 'Roll %m.direction speed %n', 'roll2', 'forward', '0'],
            ['w', 'LED %m.light', 'light', 'red', '0'],
            ['h', 'when collision detected', 'when_collision']
        ],
        menus: {
            direction: ['forward', 'backward', 'left', 'right'],
            light: ['red', 'bright red', 'yellow', 'green', 'bright blue', 'blue', 'magenta','white','off']
        }
    };

    // Register the extension
    ScratchExtensions.register('SPRK', descriptor, ext, {type: 'serial'});

})({});