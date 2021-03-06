(function(ext) {
    var extDevice = null;
    var rawData = null;
    
    var HeaderStart = 0x3C;
    var HeaderEnd = 0x3E;
    
    // Sensor ID
    var CollisionSensorID = 0x40;

    // Command ID
    var SysCmdID = 0;
    var RollCmdID = 1;
    var LedCmdID = 2;
    
    // Command type
    var TailLampID = 0x01; // for LED
    var AimingModeID = 0x01; // for ROLL
    var HeadingModeID = 0x02;   // for ROLL
    var CollisionConfigID = 0x80;   // for SYSTEM
   

    
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
        if (inputSensor[0] == CollisionSensorID) {
            if(inputSensor[1] != 0) {
                inputSensor[0] = 0;  // clear
                inputSensor[1] = 0;  // clear
                return true;
            }
        }
        return false;
    };
   
    ext.roll = function(angle, speed) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Rolling angle:'+angle+' speed:'+speed);
        if(speed > 255) speed = 255; if(speed < 0) speed = 0;
        if(angle > 359) angle = 359; if(angle < 0) angle = 0;
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

        if(angle > 359) angle = 359; if(angle < 0) angle = 0;

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

        if(angle > 359) angle = 359; if(angle < 0) angle = 0;
        
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
        
        if(vRed>255) vRed=255; if(vRed < 0) vRed = 0;
        if(vGreen>255) vGreen=255; if(vGreen < 0) vGreen = 0;
        if(vBlue>255) vBlue=255; if(vBlue < 0) vBlue = 0;
        
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
        
        if(vBrightness>255) vBrightness=255; if(vBrightness<0) vBrightness=0;

        TxCmdBuffer[2] = TailLampID; // Tail Lamp
        TxCmdBuffer[3] = 0;
        TxCmdBuffer[4] = 0;
        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = vBrightness;

        extDevice.send(TxCmdBuffer.buffer);
    }

    ext.collisionConfig = function(vThreshold, vSpeed, vDuration)
    {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Collision config, threshold: '+vThreshold+' Speed:'+vSpeed+' Duration:'+vDuration+' sec');
        
        if(vThreshold > 255) vThreshold = 255; if(vThreshold < 0) vThreshold = 0;
        if(vSpeed > 255) vSpeed = 255; if(vSpeed < 0) vSpeed = 0;
        if(vDuration > 2.5) vDuration = 2.5; if(vDuration < 0) vDuration = 0;

        var vDuration10ms = vDuration * 100;
        
        initCmdBuffer(SysCmdID); // System command
        
        TxCmdBuffer[2] = CollisionConfigID; // Tail Lamp
        TxCmdBuffer[3] = 1;  // default
        TxCmdBuffer[4] = vThreshold;
        TxCmdBuffer[5] = vSpeed;
        TxCmdBuffer[6] = vDuration10ms;

        extDevice.send(TxCmdBuffer.buffer);
    }

    ext.collisionSensingOff = function()
    {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Collision config OFF');
        
        ext.collisionConfig(0,0,0);
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
            watchdog = setTimeout(watchdog_func, 3000);
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
        
        watchdog = setTimeout(watchdog_func, 3000);
    }
    
    function watchdog_func() {
        // This device didn't get good data in time, so give up on it. Clean up and then move on.
        // If we get good data then we'll terminate this watchdog.
        if(poller) clearInterval(poller);
        poller = null;
        extDevice.set_receive_handler(null);
        extDevice.close();
        extDevice = null;
        extDeviceOnline = false;
        tryNextDevice();
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
            // 'b'      Boolean reporter (like  'r'  but returns only  true  or  false ) 
            en: [
              [' ', 'Roll to %n degrees, speed %n', 'roll', '0', '50'],
              [' ', 'Roll to %m.direction , speed %n', 'rollDir', 'forward', '50'],
              [' ', 'Roll Stop','rollStop'],
              ['-'],
              [' ', 'set Heading %n degrees', 'headingAngle', '0'],
              ['-'],
              [' ', 'set Color to %m.lightColor', 'light', 'red'],
              [' ', 'set Color with Red:%n Green:%n Blue:%n', 'lightRGB', '255', '0', '0'],
              [' ', 'set Tail Lamp %n','tailLamp','255'],
              ['-'],
              [' ', 'config Collision sensing, threshold %n , speed %n , duration %n sec', 'collisionConfig', '50', '50', '1'],
              [' ', 'config Collision sensing OFF', 'collisionSensingOff'],
              ['h', 'when Collision detected', 'whenSensorDetected'],
              ['-'],
              [' ', 'Aiming, rotate %m.aimingAngle degrees', 'aimingAngle', '10'],
              [' ', 'Aiming, End','aimingStop']
            ],
            ko: [
              [' ', '이동 %n 도 방향, 속도 %n', 'roll', '0', '50'],
              [' ', '이동 %m.direction 속도 %n', 'rollDir', '앞으로', '50'],
              [' ', '이동 정지','rollStop'],
              ['-'],
              [' ', '머리 방향, %n 도', 'headingAngle', '0'],
              ['-'],
              [' ', '색 바꾸기, %m.lightColor', 'light', '빨강'],
              [' ', '색 바꾸기, 빨강:%n 초록:%n 파랑:%n', 'lightRGB', '255', '0', '0'],
              [' ', '조준 조명 %n','tailLamp','255'],
              ['-'],
              [' ', '충돌감지, 기준값 %n , 속도 %n , 발생기간 %n 초', 'collisionConfig', '50', '50', '1'],
              [' ', '충돌감지 끄기', 'collisionSensingOff'],
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
    
    var urls = {
       en: 'http://hreclove.github.io/extension/en/sprk/',
       ko: 'http://hreclove.github.io/extension/ko/sprk/'
    };
  
    // Block and block menu descriptions
    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang],
        url: urls[lang]
    };

    // Register the extension
    ScratchExtensions.register('SPRK', descriptor, ext, {type: 'serial'});

})({});