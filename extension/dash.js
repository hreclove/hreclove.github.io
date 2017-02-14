(function(ext) {
    var extDevice = null;
    var rawData = null;
    
    var HeaderStart = 0x3C;
    var HeaderEnd = 0x3E;
    
    var TopButtonID = 0x40;  // TODO 
   
    // Command ID
    var SysCmdID = 0;
    var RollCmdID = 1;
    var LedCmdID = 2;
    var SoundCmdID = 3;

    // Command type
    var TailLampID = 0x01; // for LED
    var TopButtonLampID = 0x02;
    var LeftEarLampID = 0x03;
    var RightEarLampID = 0x04;
    var ChestLampID = 0x05;
    var EyesLampID = 0x06;
    
    var HeadMoveID = 0x03;   // for ROLL
    
    var SoundPlayID = 0x01;  // for SOUND
    
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
        'forward': 0, 
        'backward': 1, 
        'left': 2, 
        'right': 3
    };
    
    var lightLampRgbTable = {
        'left ear': 0,
        'right ear': 1,
        'chest': 2,
    }
    
    var lightLampTable = {
        'tail': 0,
        'top button': 1
    };
    
    var onOffTable = {
        'off': 0,
        'on': 1
    }

    var TxCmdBuffer = new Uint8Array(8);
    
    // Top button pressed
    ext.whenTopButtonPressed = function () {
        if (!extDevice || !extDeviceOnline) return false;
        if (inputSensor[0] == TopButtonID) {
            if(inputSensor[1] != 0) {
                inputSensor[0] = 0;  // clear
                inputSensor[1] = 0;  // clear
                return true;
            }
        }
        return false;
    };
   
    ext.bodyMove = function(angularVelocity, linearVelocity) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Rolling angularVelocity:'+angularVelocity+' linearVelocity:'+linearVelocity);

        if(angularVelocity>389) angularVelocity = 389;
        if(angularVelocity<-389) angularVelocity = -389;
        
        if(linearVelocity>100) linearVelocity = 100;
        if(linearVelocity<-100) linearVelocity =-100;
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = 0; // roll mode
        TxCmdBuffer[3] = getByte_High(angularVelocity);
        TxCmdBuffer[4] = getByte_Low(angularVelocity);
        TxCmdBuffer[5] = getByte_High(linearVelocity);
        TxCmdBuffer[6] = getByte_Low(linearVelocity);

        extDevice.send(TxCmdBuffer.buffer);

    };

    ext.bodyMoveDir = function(dir, linearVelocity) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Rolling dir:'+dir+' linearVelocity:'+linearVelocity);
        
        if(dir == menus[lang]['direction'][dirTable['forward']]) ext.bodyMove(0,linearVelocity);
        else if(dir == menus[lang]['direction'][dirTable['backward']]) ext.bodyMove(0,linearVelocity);
        else if(dir == menus[lang]['direction'][dirTable['left']]) ext.bodyMove(90,linearVelocity);
        else if(dir == menus[lang]['direction'][dirTable['right']]) ext.bodyMove(-90,linearVelocity);
    };
    
    ext.stopMove = function() {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('rollStop');
        
        ext.bodyMove(0,0);
    };

    ext.headPosition = function(angleX, angleY) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Head Posion angleX:'+angleX+' angleY:'+angleY);
        
        if(angleX < -120) angleX = -120;
        if(angleX > 120) angleX = 120;
        
        if(angleY > 7) angleY = 7;
        if(angleY < -20) angleY = -20;
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = HeadMoveID; // roll mode
        TxCmdBuffer[3] = getByte_High(angleX);
        TxCmdBuffer[4] = getByte_Low(angleX);
        TxCmdBuffer[5] = getByte_High(angleY);
        TxCmdBuffer[6] = getByte_Low(angleY);

        extDevice.send(TxCmdBuffer.buffer);

    };


    ext.light = function(vName, vColor) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('LED name :'+vName + ' color:'+vColor);

        if(vColor == menus[lang]['lightColor'][colorTable['red']]) {ext.lightRGB(vName,255,0,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['bright red']]) {ext.lightRGB(vName,255,128,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['yellow']]) {ext.lightRGB(vName,255,255,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['green']]) {ext.lightRGB(vName,0,255,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['bright blue']]) {ext.lightRGB(vName,0,128,255);}	
        else if(vColor == menus[lang]['lightColor'][colorTable['blue']]) {ext.lightRGB(vName,0,0,255);}
        else if(vColor == menus[lang]['lightColor'][colorTable['magenta']]) {ext.lightRGB(vName,255,0,255);}	
        else if(vColor == menus[lang]['lightColor'][colorTable['white']]) {ext.lightRGB(vName,255,255,255);}
        else if(vColor == menus[lang]['lightColor'][colorTable['off']]) {ext.lightRGB(vName,0,0,0);}
    };

    ext.lightRGB = function(vName, vRed,vGreen,vBlue) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('LED name:'+vName+' R:'+vRed+' G:'+vGreen+' B:'+vBlue);
                      
        initCmdBuffer(LedCmdID); // LED command
        
        if(vRed>255) vRed=255; if(vRed < 0) vRed = 0;
        if(vGreen>255) vGreen=255; if(vGreen < 0) vGreen = 0;
        if(vBlue>255) vBlue=255; if(vBlue < 0) vBlue = 0;
        
        if(vName == menus[lang]['ledName'][lightLampRgbTable['left ear']]) {TxCmdBuffer[2] =LeftEarLampID;}
        else if(vName == menus[lang]['ledName'][lightLampRgbTable['right ear']]) {TxCmdBuffer[2] = RightEarLampID;}
        else if(vName == menus[lang]['ledName'][lightLampRgbTable['chest']]) {TxCmdBuffer[2] = ChestLampID;}
 
        TxCmdBuffer[3] = vRed;
        TxCmdBuffer[4] = vGreen;
        TxCmdBuffer[5] = vBlue;
        TxCmdBuffer[6] = 0; // backlight

        extDevice.send(TxCmdBuffer.buffer);
    };

    ext.lightLamp = function(vName, vBrightness) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Light Lamp name:'+vName+' Brightness:'+vBrightness);
                      
        initCmdBuffer(LedCmdID); // LED command
        
        if(vBrightness>255) vBrightness=255; if(vBrightness<0) vBrightness=0;
        
        if(vName == menus[lang]['lampName'][lightLampTable['tail']]) {TxCmdBuffer[2] = TailLampID;}
        else if(vName == menus[lang]['lampName'][lightLampTable['top button']]) {TxCmdBuffer[2] = TopButtonLampID; }

        TxCmdBuffer[3] = 0;
        TxCmdBuffer[4] = 0;
        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = vBrightness; // backlight

        extDevice.send(TxCmdBuffer.buffer);
    };


    ext.lightEyes = function(vEyesLampID, vOnOff) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Eyes '+vEyesLampID+' OnOff:'+vOnOff);
                      
        initCmdBuffer(LedCmdID); // LED command

        TxCmdBuffer[2] = EyesLampID; // which lamp
        TxCmdBuffer[3] = 0;
        TxCmdBuffer[4] = 0;
        TxCmdBuffer[5] = vEyesLampID;

        if(vOnOff == menus[lang]['onOff'][onOffTable['off']]) {TxCmdBuffer[6] = 0;}
        else if(vOnOff == menus[lang]['onOff'][onOffTable['on']]) {TxCmdBuffer[6] = 255;}

        extDevice.send(TxCmdBuffer.buffer);
    };
    

    ext.lightEyesMask = function(vHexMask, vOnOff) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;
        
        var vDec = parseInt(vHexMask,16);
        console.log('Eyes Mask:'+vHexMask+' dec='+vDec);
                      
        initCmdBuffer(LedCmdID); // LED command

        TxCmdBuffer[2] = EyesLampID; // which lamp
        TxCmdBuffer[3] = getByte_High(vDec);
        TxCmdBuffer[4] = getByte_Low(vDec);
        TxCmdBuffer[5] = 0;

        if(vOnOff == menus[lang]['onOff'][onOffTable['off']]) {TxCmdBuffer[6] = 0;}
        else if(vOnOff == menus[lang]['onOff'][onOffTable['on']]) {TxCmdBuffer[6] = 255;}

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.soundPlay = function(vSndIndex, vVolume) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;
        
        console.log('Sound index:'+vSndIndex+' volume:'+vVolume);

        if(vVolume > 100) vVolume = 100; if(vVolume<0) vVolume = 0;
                      
        initCmdBuffer(SoundCmdID); // Sound command

        TxCmdBuffer[2] = SoundPlayID; // which sound type
        TxCmdBuffer[3] = vSndIndex;
        TxCmdBuffer[4] = vVolume;
        TxCmdBuffer[5] = 0;

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.soundPlayExt = function(vSndIndex,vVolume) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;
        
        console.log('Sound Group2 index:'+vSndIndex + ' volume:'+vVolume);
    
        ext.soundPlay(0x80+vSndIndex,vVolume);
    };

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
        // Tell the DASH to send a input data every 1000ms       
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
        if(!extDevice) return {status: 1, msg: 'DASH disconnected'};
        if(extDeviceOnline) return {status: 2, msg: 'DASH connected'};
        return {status: 1, msg: 'Probing for DASH'};
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
              [' ', 'Moving, Angular %n degrees/sec, Linear %n cm/sec', 'bodyMove', '0', '20'],
              [' ', 'Moving, %m.direction , Linear %n cm/sec', 'bodyMoveDir', 'forward', '20'],
              [' ', 'Stop Move','stopMove'],
              ['-'],
              [' ', 'Head position to X %n, Y %n', 'headPosition','0','0'],
              ['-'],
              [' ', 'Color %m.ledName to %m.lightColor', 'light', 'chest', 'red'],
              [' ', 'Color %m.ledName with Red:%n Green:%n Blue:%n', 'lightRGB', 'chest', '255', '0', '0'],
              [' ', 'Lamp %m.lampName with Brightness:%n', 'lightLamp', 'top button','255'],
              [' ', 'Eye Lamp #%m.eyeLamp %m.onOff', 'lightEyes', '1', 'on'],
              [' ', 'Eye Lamp Pattern 0x%n for %m.onOff', 'lightEyesMask', '0FFF', 'on'],
              ['-'],
              [' ', 'Sound %m.soundGroup with volume %n', 'soundPlay','ok','80'],
              ['-'],
              ['h', 'when TopButton Pressed', 'whenTopButtonPressed'],
              ['-']
            ],
            ko: [
              [' ', '이동, 초당 %n 도 회전, 초당 %n cm직진', 'bodyMove', '0', '50'],
              [' ', '이동, %m.direction 방향, 초당 %n cm직진', 'bodyMoveDir', '앞으로', '30'],
              [' ', '이동 정지','stopMove'],
              ['-'],
              [' ', '머리 위치, 가로 %n, 세로 %n', 'headPosition','0','0'],
              ['-'],
              [' ', '색 바꾸기,%m.ledName %m.lightColor', 'light', '가슴', '빨강'],
              [' ', '색 바꾸기,%m.ledName 빨강:%n 초록:%n 파랑:%n', 'lightRGB', '가슴', '255', '0', '0'],
              [' ', '램프 %m.lampName 밝기:%n', 'lightLamp', '큰 버튼','255'],
              [' ', '눈 조명 #%m.eyeLamp %m.onOff', 'lightEyes', '1', '켜기'],
              [' ', '눈 조명, 모양값 0x%n 으로 %m.onOff', 'lightEyesMask', '0FFF', '켜기'],
              ['-'],
              [' ', '소리 %m.soundGroup , 음량 %n', 'soundPlay','ok','80'],
              ['-'],
              ['h', '큰 버튼을 누르면', 'whenTopButtonPressed'],
              ['-']
            ]
    };

    var menus = {
          en: {
            direction: ['forward', 'backward', 'left', 'right'],
            lightColor: ['red', 'bright red', 'yellow', 'green', 'bright blue', 'blue', 'magenta','white','off'],
            ledName: ['left ear', 'right ear', 'chest'],
            lampName: ['tail', 'top button'],
            eyeLamp: ['1','2','3','4','5','6','7','8','9','10','11','12'],
            soundGroup:['ok','bye','sigh','bragging','confused','cool','huh','hi','wah','wow','wee','woohoo','haha','ooh','grunt','lets go','tah dah','snoring','surprised','weehee','uh huh','uh oh','yippe'],
            onOff: ['off','on']
          },
          ko: {
            direction: ['앞으로', '뒤로', '왼쪽', '오른쪽'],
            lightColor: ['빨강', '주황', '노랑', '초록', '하늘', '파랑', '보라', '흰', '끄기'],
            ledName: ['왼쪽 귀', '오른쪽 귀', '가슴'],
            lampName: ['꼬리등', '큰 버튼'],
            eyeLamp: ['1','2','3','4','5','6','7','8','9','10','11','12'],
            soundGroup:['ok','bye','sigh','bragging','confused','cool','huh','hi','wah','wow','wee','woohoo','haha','ooh','grunt','lets go','tah dah','snoring','surprised','weehee','uh huh','uh oh','yippe'],
            onOff: ['끄기','켜기']
          }
    };
  
    // Block and block menu descriptions
    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang],
        url: 'http://hreclove.github.io/extension/dash/'
    };

    // Register the extension
    ScratchExtensions.register('DASH', descriptor, ext, {type: 'serial'});

})({});