(function(ext) {
    var extDevice = null;
    var rawData = null;
    
    var HeaderStart = 0x3C;
    var HeaderEnd = 0x3E;
    var CollisionSensorID = 0x40;
    var TailLampID = 0x01; // for LED
    var AimingModeID = 0x01; // for ROLL
    var HeadingModeID = 0x02;   // for ROLL
   
    var SysCmdID = 0;
    var RollCmdID = 1;
    var LedCmdID = 2;
    
    var extDeviceOnline = false;
    
    var channels = {
        sensor: 1,
        system: 0
    };
    
    var colorTable = {
        'red': 0,
        'bright red': 1, 
        'yellow': 2, 
        'green': 3, 
        'bright blue': 4,
        'blue': 5, 
        'magenta': 6,
        'white': 7,
        'off' : 8
    };
    
    var dirTable = {
        'forward':0, 
        'backward': 1, 
        'left': 2, 
        'right': 3
    };

    var TxCmdBuffer = new Uint8Array(8);
    
    // Collision Sensor detected
    ext.whenSensorDetected = function () {
        if (!extDevice || !extDeviceOnline) return false;
        if (inputSensor[0] == CollisionSensorID) return true;
        return false;
    };
   
    ext.roll = function(angle, speed) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Rolling angle:'+angle+' speed:'+speed);
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = 0; // roll mode
        TxCmdBuffer[3] = getByte_High(angle);
        TxCmdBuffer[4] = getByte_Low(angle);
        TxCmdBuffer[5] = getByte_High(speed);
        TxCmdBuffer[6] = getByte_Low(speed);

        extDevice.send(TxCmdBuffer.buffer);

    };

    ext.rollDir = function(dir, speed) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Rolling dir:'+dir+' speed:'+speed);
        
        if(dir == menus[lang]['direction'][dirTable['forward']]) ext.roll(0,speed);
        else if(dir == menus[lang]['direction'][dirTable['backward']]) ext.roll(180,speed);
        else if(dir == menus[lang]['direction'][dirTable['left']]) ext.roll(270,speed);
        else if(dir == menus[lang]['direction'][dirTable['right']]) ext.roll(90,speed);
    };
    
    ext.rollStop = function() {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('rollStop');
        
        ext.roll(0,0);
    };


    ext.aimingAngle = function(angle) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Aiming, angle:'+angle);
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = AimingModeID; // Aiming mode
        TxCmdBuffer[3] = getByte_High(angle);
        TxCmdBuffer[4] = getByte_Low(angle);
        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = 0;

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.aimingStop = function() {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Aiming Stop');
        
        ext.roll(0,0);
    }

    ext.headingAngle = function(angle) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Heading:'+angle);
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = HeadingModeID; // heading mode
        TxCmdBuffer[3] = getByte_High(angle);
        TxCmdBuffer[4] = getByte_Low(angle);
        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = 0;

        extDevice.send(TxCmdBuffer.buffer);
    };

    ext.light = function(color) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('LED color:'+color);

                      
        if(color == menus[lang]['lightColor'][colorTable['red']]) {ext.lightRGB(255,0,0);}
        else if(color == menus[lang]['lightColor'][colorTable['bright red']]) {ext.lightRGB(255,128,0);}
        else if(color == menus[lang]['lightColor'][colorTable['yellow']]) {ext.lightRGB(255,255,0);}
        else if(color == menus[lang]['lightColor'][colorTable['green']]) {ext.lightRGB(0,255,0);}
        else if(color == menus[lang]['lightColor'][colorTable['bright blue']]) {ext.lightRGB(0,128,255);}	
        else if(color == menus[lang]['lightColor'][colorTable['blue']]) {ext.lightRGB(0,0,255);}
        else if(color == menus[lang]['lightColor'][colorTable['magenta']]) {ext.lightRGB(255,0,255);}	
        else if(color == menus[lang]['lightColor'][colorTable['white']]) {ext.lightRGB(255,255,255);}
        else if(color == menus[lang]['lightColor'][colorTable['off']]) {ext.lightRGB(0,0,0);}
    };

    ext.lightRGB = function(vRed,vGreen,vBlue) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('LED R:'+vRed+' G:'+vGreen+' B:'+vBlue);
                      
        initCmdBuffer(LedCmdID); // LED command
        
        if(vRed>255) vRed=255;
        if(vGreen>255) vGreen=255;
        if(vBlue>255) vBlue=255;
        
        TxCmdBuffer[2] = 0; // which lamp
        TxCmdBuffer[3] = vRed;
        TxCmdBuffer[4] = vGreen;
        TxCmdBuffer[5] = vBlue;
        TxCmdBuffer[6] = 0; // backlight

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.tailLamp = function(vBrightness) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('tail Lamp : '+vBrightness);
        
        initCmdBuffer(LedCmdID); // LED command
        
        TxCmdBuffer[2] = TailLampID; // Tail Lamp
        TxCmdBuffer[3] = 0;
        TxCmdBuffer[4] = 0;
        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = vBrightness;

        extDevice.send(TxCmdBuffer.buffer);
    }

    function initCmdBuffer(cmdType) {
    	TxCmdBuffer[0] = HeaderStart;
    	TxCmdBuffer[1] = cmdType;
    	TxCmdBuffer[7] = HeaderEnd;
    	for (var i = 2;i < 7;i++) {
    		TxCmdBuffer[i] = 0;
    	}
    }

    function getByte_High(vBits16) {
    	return ((vBits16 >> 8) & 0xFF);
    }
    
    function getByte_Low(vBits16) {
    	return (vBits16 & 0xFF);
    }

    var inputSystem = [];
    var inputSensor = [];

    function processData() {
        var bytes = new Uint8Array(rawData);
        
        var channel = bytes[1];
        if(channel == channels['system']) {
            for (var i = 2; i < 7; i++) {
                //console.log('inputSystem='+bytes[i].toString(16));
                inputSystem[i-2] = bytes[i];  // received data without Header < >
            }
        } 
        else if(channel == channels['sensor']) {
        	for (var i = 2; i < 7; i++) {
        		//console.log('inputSensor='+bytes[i].toString(16));
            inputSensor[i-2] = bytes[i];  // received data without Header < >
        	}
        }
        
        if(inputSystem[0] == 2) {
        	extDeviceOnline = true;
        }
        else {
        	extDeviceOnline = false;
        }

        if (watchdog) {
            clearTimeout(watchdog);
        }
        
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

        if (!extDevice) {
            tryNextDevice();
        }
    };

    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        extDevice = potentialDevices.shift();
        try{
        if (extDevice) {
            extDevice.open({stopBits: 0, bitRate: 38400, ctsFlowControl: 0}, deviceOpened);
        }
        } 
        catch(err) {
            console.log('Device Open Error');
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
        extDevice.set_receive_handler(function (data) {
            console.log('Received: ' + data.byteLength);
            if (!rawData || rawData.byteLength == 8) {
                rawData = new Uint8Array(data);
            } else {
                rawData = appendBuffer(rawData, data);
            }

            if (rawData.byteLength >= 8) {
                console.log(rawData);
                processData();
                //extDevice.send(pingCmd.buffer);
            }
        });

        sendStartPing();
        
        watchdog = setTimeout(function () {
            // This device didn't get good data in time, so give up on it. Clean up and then move on.
            // If we get good data then we'll terminate this watchdog.
            if(poller) clearInterval(poller);
            poller = null;
            extDevice.set_receive_handler(null);
            extDevice.close();
            extDevice = null;
            extDeviceOnline = false;
            tryNextDevice();
        }, 3000);
    }

    function sendStartPing() {
        // Tell the SPRK to send a input data every 1000ms       
        var pingCmd = new Uint8Array(2);
        pingCmd[0] = HeaderStart;
        pingCmd[1] = HeaderEnd;
        poller = setInterval(function () {
            extDevice.send(pingCmd.buffer);
        }, 1000);
    }
    
    function stopPing() {
        // Stop send PING
        if (poller) poller = clearInterval(poller);
        poller = null;
    }

    ext._deviceRemoved = function (dev) {
        if (extDevice != dev) return;
        if (poller) poller = clearInterval(poller);
        poller = null;
        extDevice = null;
        extDeviceOnline = false;
    };

    ext._shutdown = function () {
        if (poller) poller = clearInterval(poller);
        poller = null;
        if (extDevice) extDevice.close();
        extDevice = null;
        extDeviceOnline = false;
    };

    ext._getStatus = function () {
        if(!extDevice) return {status: 1, msg: 'SPRK disconnected'};
        if(extDeviceOnline) return {status: 2, msg: 'SPRK connected'};
        return {status: 1, msg: 'Probing for SPRK'};
    };

    // Check for GET param 'lang'
    var paramString = window.location.search.replace(/^\?|\/$/g, '');
    var vars = paramString.split("&");
    var lang = 'en';
    for (var i=0; i<vars.length; i++) {
    var pair = vars[i].split('=');
      if (pair.length > 1 && pair[0]=='lang')
        lang = pair[1];
    }
    
    var blocks = {
            // [ Type, String, Callback, Default menu values ]
            // Types: 
            // ' ' 	Synchronous command
            // 'w' 	Asynchronous command
            // 'r' 	Synchronous reporter
            // 'R' 	Asynchronous reporter
            // 'h' 	Hat block (synchronous, returns boolean, true = run stack)
            en: [
              [' ', 'Roll to %n degrees, speed %n', 'roll', '0', '50'],
              [' ', 'Roll to %m.direction , speed %n', 'rollDir', 'forward'],
              [' ', 'Roll Stop','rollStop'],
              [' ', 'set Heading %n degrees', 'headingAngle', '0'],
              [' ', 'set Color to %m.lightColor', 'light', 'red'],
              [' ', 'set Color with Red:%n Green:%n Blue:%n', 'lightRGB', '255', '0', '0'],
              [' ', 'set Tail Lamp %n.taillight','tailLamp','255'],
              ['h', 'when Collision detected', 'whenSensorDetected'],
              ['-'],
              [' ', 'Aiming, rotate %m.aimingAngle degrees', 'aimingAngle', '10'],
              [' ', 'Aiming, End','aimingStop']
            ],
            ko: [
              [' ', '이동 %n 도 방향, 속도 %n', 'roll', '0', '50'],
              [' ', '이동 %m.direction 속도 %n', 'rollDir', '앞으로'],
              [' ', '이동 정지','rollStop'],
              [' ', '머리 방향, %n 도', 'headingAngle', '0'],
              [' ', '색 바꾸기, %m.lightColor', 'light', '빨강'],
              [' ', '색 바꾸기, 빨강:%n 초록:%n 파랑:%n', 'lightRGB', '255', '0', '0'],
              [' ', '조준 조명 %n','tailLamp','255'],
              ['h', '충돌하면', 'whenSensorDetected'],
              ['-'],
              [' ', '정면맞추기, %m.aimingAngle 도 회전', 'aimingAngle', '10'],
              [' ', '정면맞추기, 완료','aimingStop']
            ]
    };

    var menus = {
          en: {
            direction: ['forward', 'backward', 'left', 'right'],
            lightColor: ['red', 'bright red', 'yellow', 'green', 'bright blue', 'blue', 'magenta','white','off'],
            aimingAngle: ['5','10','15','30','45']
          },
          ko: {
            direction: ['앞으로', '뒤로', '왼쪽', '오른쪽'],
            lightColor: ['빨강', '주황', '노랑', '초록', '하늘', '파랑', '보라', '흰', '끄기'],
            aimingAngle: ['5','10','15','30','45']
          }
    };
  
    // Block and block menu descriptions
    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang],
        url: 'http://hreclove.github.io/extension/sprk/'
    };

    // Register the extension
    ScratchExtensions.register('SPRK', descriptor, ext, {type: 'serial'});

})({});