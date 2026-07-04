gancube.js: execMain(function() {
var _gatt;
var _service_data;
var _service_meta;
var _chrct_f2;
var _chrct_f5;
var _chrct_f6;
var _chrct_f7;

var UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';  
var SERVICE_UUID_META = '0000180a' + UUID_SUFFIX;  
var CHRCT_UUID_VERSION = '00002a28' + UUID_SUFFIX;  
var CHRCT_UUID_HARDWARE = '00002a23' + UUID_SUFFIX;  
var SERVICE_UUID_DATA = '0000fff0' + UUID_SUFFIX;  
var CHRCT_UUID_F2 = '0000fff2' + UUID_SUFFIX; // cube state, (54 - 6) facelets, 3 bit per facelet  
var CHRCT_UUID_F3 = '0000fff3' + UUID_SUFFIX; // prev moves  
var CHRCT_UUID_F5 = '0000fff5' + UUID_SUFFIX; // gyro state, move counter, pre moves  
var CHRCT_UUID_F6 = '0000fff6' + UUID_SUFFIX; // move counter, time offsets between premoves  
var CHRCT_UUID_F7 = '0000fff7' + UUID_SUFFIX;  

var _service_v2data;  
var _chrct_v2read;  
var _chrct_v2write;  
var SERVICE_UUID_V2DATA = '6e400001-b5a3-f393-e0a9-e50e24dc4179';  
var CHRCT_UUID_V2READ = '28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4';  
var CHRCT_UUID_V2WRITE = '28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4';  

var _service_v3data;  
var _chrct_v3read;  
var _chrct_v3write;  
var SERVICE_UUID_V3DATA = '8653000a-43e6-47b7-9cb0-5fc21d4ae340';  
var CHRCT_UUID_V3READ = '8653000b-43e6-47b7-9cb0-5fc21d4ae340';  
var CHRCT_UUID_V3WRITE = '8653000c-43e6-47b7-9cb0-5fc21d4ae340';  

var _service_v4data;  
var _chrct_v4read;  
var _chrct_v4write;  
var SERVICE_UUID_V4DATA = '00000010-0000-fff7-fff6-fff5fff4fff0';  
var CHRCT_UUID_V4READ = '0000fff6-0000-1000-8000-00805f9b34fb';  
var CHRCT_UUID_V4WRITE = '0000fff5-0000-1000-8000-00805f9b34fb';  

// List of Company Identifier Codes, fill with all values range [0x0001, 0xFF01] possible for GAN cubes  
var GAN_CIC_LIST = mathlib.valuedArray(256, function (i) { return (i << 8) | 0x01 });  

var decoder = null;  
var deviceName = null;  
var deviceMac = null;  

var KEYS = [  
	"NoRgnAHANATADDWJYwMxQOxiiEcfYgSK6Hpr4TYCs0IG1OEAbDszALpA",  
	"NoNg7ANATFIQnARmogLBRUCs0oAYN8U5J45EQBmFADg0oJAOSlUQF0g",  
	"NoRgNATGBs1gLABgQTjCeBWSUDsYBmKbCeMADjNnXxHIoIF0g",  
	"NoRg7ANAzBCsAMEAsioxBEIAc0Cc0ATJkgSIYhXIjhMQGxgC6QA",  
	"NoVgNAjAHGBMYDYCcdJgCwTFBkYVgAY9JpJYUsYBmAXSA",  
	"NoRgNAbAHGAsAMkwgMyzClH0LFcArHnAJzIqIBMGWEAukA"  
];  

function getKey(version, value) {  
	var key = KEYS[version >> 8 & 0xff];  
	if (!key) {  
		return;  
	}  
	key = JSON.parse(LZString.decompressFromEncodedURIComponent(key));  
	for (var i = 0; i < 6; i++) {  
		key[i] = (key[i] + value.getUint8(5 - i)) & 0xff;  
	}  
	return key;  
}  

function getKeyV2(value, ver) {  
	ver = ver || 0;  
	var key = JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[2 + ver * 2]));  
	var iv = JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[3 + ver * 2]));  
	for (var i = 0; i < 6; i++) {  
		key[i] = (key[i] + value[5 - i]) % 255;  
		iv[i] = (iv[i] + value[5 - i]) % 255;  
	}  
	return [key, iv];  
}  

function decode(value) {  
	var ret = [];  
	for (var i = 0; i < value.byteLength; i++) {  
		ret[i] = value.getUint8(i);  
	}  
	if (decoder == null) {  
		return ret;  
	}  
	var iv = decoder.iv || [];  
	if (ret.length > 16) {  
		var offset = ret.length - 16;  
		var block = decoder.decrypt(ret.slice(offset));  
		for (var i = 0; i < 16; i++) {  
			ret[i + offset] = block[i] ^ (~~iv[i]);  
		}  
	}  
	decoder.decrypt(ret);  
	for (var i = 0; i < 16; i++) {  
		ret[i] ^= (~~iv[i]);  
	}  
	return ret;  
}  

function encode(ret) {  
	if (decoder == null) {  
		return ret;  
	}  
	var iv = decoder.iv || [];  
	for (var i = 0; i < 16; i++) {  
		ret[i] ^= ~~iv[i];  
	}  
	decoder.encrypt(ret);  
	if (ret.length > 16) {  
		var offset = ret.length - 16;  
		var block = ret.slice(offset);  
		for (var i = 0; i < 16; i++) {  
			block[i] ^= ~~iv[i];  
		}  
		decoder.encrypt(block);  
		for (var i = 0; i < 16; i++) {  
			ret[i + offset] = block[i];  
		}  
	}  
	return ret;  
}  

function v1init() {  
	giikerutil.log('[gancube] v1init start');  
	return _service_meta.getCharacteristic(CHRCT_UUID_VERSION).then(function(chrct) {  
		return chrct.readValue();  
	}).then(function(value) {  
		var version = value.getUint8(0) << 16 | value.getUint8(1) << 8 | value.getUint8(2);  
		giikerutil.log('[gancube] version', version.toString(16));  
		decoder = null;  
		if (version > 0x010007 && (version & 0xfffe00) == 0x010000) {  
			return _service_meta.getCharacteristic(CHRCT_UUID_HARDWARE).then(function(chrct) {  
				return chrct.readValue();  
			}).then(function(value) {  
				var key = getKey(version, value);  
				if (!key) {  
					logohint.push(LGHINT_BTNOTSUP);  
					return;  
				}  
				giikerutil.log('[gancube] key', JSON.stringify(key));  
				decoder = $.aes128(key);  
			});  
		} else { //not support  
			logohint.push(LGHINT_BTNOTSUP);  
		}  
	}).then(function() {  
		return _service_data.getCharacteristics();  
	}).then(function(chrcts) {  
		giikerutil.log('[gancube] v1init find chrcts', chrcts);  
		_chrct_f2 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F2);  
		_chrct_f5 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F5);  
		_chrct_f6 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F6);  
		_chrct_f7 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F7);  
	}).then(loopRead);  
}  

function getManufacturerDataBytes(mfData) {  
	if (mfData instanceof DataView) { // this is workaround for Bluefy browser  
		return new DataView(mfData.buffer.slice(2, 11));  
	}  
	for (var id of GAN_CIC_LIST) {  
		if (mfData.has(id)) {  
			giikerutil.log('[gancube] found Manufacturer Data under CIC = 0x' + id.toString(16).padStart(4, '0'));  
			return new DataView(mfData.get(id).buffer.slice(0, 9));  
		}  
	}  
	giikerutil.log('[gancube] Looks like this cube has new unknown CIC');  
}  

function v2initKey(forcePrompt, isWrongKey, ver) {  
	var mac = giikerutil.reqMacAddr(forcePrompt, isWrongKey, deviceMac, null);  
	if (!mac) {  
		decoder = null;  
		return;  
	}  
	v2initDecoder(mac, ver);  
}  

function v2initDecoder(mac, ver) {  
	var value = [];  
	for (var i = 0; i < 6; i++) {  
		value.push(parseInt(mac.slice(i * 3, i * 3 + 2), 16));  
	}  
	var keyiv = getKeyV2(value, ver);  
	decoder = $.aes128(keyiv[0]);  
	decoder.iv = keyiv[1];  
}  

function v2sendRequest(req) {  
	if (!_chrct_v2write) {  
		giikerutil.log('[gancube] v2sendRequest cannot find v2write chrct');  
		return;  
	}  
	var encodedReq = encode(req.slice());  
	giikerutil.log('[gancube] v2sendRequest', req, encodedReq);  
	return _chrct_v2write.writeValue(new Uint8Array(encodedReq).buffer);  
}  

function v2sendSimpleRequest(opcode) {  
	var req = mathlib.valuedArray(20, 0);  
	req[0] = opcode;  
	return v2sendRequest(req);  
}  

function v2requestFacelets() {  
	return v2sendSimpleRequest(4);  
}  

function v2requestBattery() {  
	return v2sendSimpleRequest(9);  
}  

function v2requestHardwareInfo() {  
	return v2sendSimpleRequest(5);  
}  

function v2init(ver) {  
	giikerutil.log('[gancube] v2init start');  
	keyCheck = 0;  
	v2initKey(true, false, ver);  
	return _service_v2data.getCharacteristics().then(function(chrcts) {  
		giikerutil.log('[gancube] v2init find chrcts', chrcts);  
		_chrct_v2read = GiikerCube.findUUID(chrcts, CHRCT_UUID_V2READ);  
		_chrct_v2write = GiikerCube.findUUID(chrcts, CHRCT_UUID_V2WRITE);  
		if (!_chrct_v2read) {  
			giikerutil.log('[gancube] v2init cannot find v2read chrct');  
		}  
	}).then(function() {  
		giikerutil.log('[gancube] v2init v2read start notifications');  
		return _chrct_v2read.startNotifications();  
	}).then(function() {  
		giikerutil.log('[gancube] v2init v2read notification started');  
		return _chrct_v2read.addEventListener('characteristicvaluechanged', onStateChangedV2);  
	}).then(function() {  
		return v2requestHardwareInfo();  
	}).then(function() {  
		return v2requestFacelets();  
	}).then(function() {  
		return v2requestBattery();  
	});  
}  

function v3sendRequest(req) {  
	if (!_chrct_v3write) {  
		giikerutil.log('[gancube] v3sendRequest cannot find v3write chrct');  
		return;  
	}  
	var encodedReq = encode(req.slice());  
	giikerutil.log('[gancube] v3sendRequest', req, encodedReq);  
	return _chrct_v3write.writeValue(new Uint8Array(encodedReq).buffer);  
}  

function v3sendSimpleRequest(opcode) {  
	var req = mathlib.valuedArray(16, 0);  
	req[0] = 0x68;  
	req[1] = opcode;  
	return v3sendRequest(req);  
}  

function v3requestFacelets() {  
	return v3sendSimpleRequest(1);  
}  

function v3requestBattery() {  
	return v3sendSimpleRequest(7);  
}  

function v3requestHardwareInfo() {  
	return v3sendSimpleRequest(4);  
}  

function v3init() {  
	giikerutil.log('[gancube] v3init start');  
	keyCheck = 0;  
	v2initKey(true, false, 0);  
	return _service_v3data.getCharacteristics().then(function(chrcts) {  
		giikerutil.log('[gancube] v3init find chrcts', chrcts);  
		_chrct_v3read = GiikerCube.findUUID(chrcts, CHRCT_UUID_V3READ);  
		_chrct_v3write = GiikerCube.findUUID(chrcts, CHRCT_UUID_V3WRITE);  
		if (!_chrct_v3read) {  
			giikerutil.log('[gancube] v3init cannot find v3read chrct');  
		}  
	}).then(function() {  
		giikerutil.log('[gancube] v3init v3read start notifications');  
		return _chrct_v3read.startNotifications();  
	}).then(function() {  
		giikerutil.log('[gancube] v3init v3read notification started');  
		return _chrct_v3read.addEventListener('characteristicvaluechanged', onStateChangedV3);  
	}).then(function() {  
		return v3requestHardwareInfo();  
	}).then(function() {  
		return v3requestFacelets();  
	}).then(function() {  
		return v3requestBattery();  
	});  
}  

function v4sendRequest(req) {  
	if (!_chrct_v4write) {  
		giikerutil.log('[gancube] v4sendRequest cannot find v4write chrct');  
		return;  
	}  
	var encodedReq = encode(req.slice());  
	giikerutil.log('[gancube] v4sendRequest', req, encodedReq);  
	return _chrct_v4write.writeValue(new Uint8Array(encodedReq).buffer);  
}  

function v4requestFacelets() {  
	var req = mathlib.valuedArray(20, 0);  
	req[0] = 0xDD;  
	req[1] = 0x04;  
	req[3] = 0xED;  
	return v4sendRequest(req);  
}  

function v4requestBattery() {  
	var req = mathlib.valuedArray(20, 0);  
	req[0] = 0xDD;  
	req[1] = 0x04;  
	req[3] = 0xEF;  
	return v4sendRequest(req);  
}  

function v4requestHardwareInfo() {  
	var req = mathlib.valuedArray(20, 0);  
	req[0] = 0xDF;  
	req[1] = 0x03;  
	return v4sendRequest(req);  
}  

function v4init() {  
	giikerutil.log('[gancube] v4init start');  
	keyCheck = 0;  
	v2initKey(true, false, 0);  
	return _service_v4data.getCharacteristics().then(function(chrcts) {  
		giikerutil.log('[gancube] v4init find chrcts', chrcts);  
		_chrct_v4read = GiikerCube.findUUID(chrcts, CHRCT_UUID_V4READ);  
		_chrct_v4write = GiikerCube.findUUID(chrcts, CHRCT_UUID_V4WRITE);  
		if (!_chrct_v4read) {  
			giikerutil.log('[gancube] v4init cannot find v4read chrct');  
		}  
	}).then(function() {  
		giikerutil.log('[gancube] v4init v4read start notifications');  
		return _chrct_v4read.startNotifications();  
	}).then(function() {  
		giikerutil.log('[gancube] v4init v4read notification started');  
		return _chrct_v4read.addEventListener('characteristicvaluechanged', onStateChangedV4);  
	}).then(function() {  
		return v4requestHardwareInfo();  
	}).then(function() {  
		return v4requestFacelets();  
	}).then(function() {  
		return v4requestBattery();  
	});  
}  

function init(device) {  
	clear();  
	deviceName = device.name;  
	giikerutil.log('[gancube] init gan cube start');  
	return GiikerCube.waitForAdvs().then(function(mfData) {  
		var dataView = getManufacturerDataBytes(mfData);  
		if (dataView && dataView.byteLength >= 6) {  
			var mac = [];  
			for (var i = 0; i < 6; i++) {  
				mac.push((dataView.getUint8(dataView.byteLength - i - 1) + 0x100).toString(16).slice(1));  
			}  
			return Promise.resolve(mac.join(':'));  
		}  
		return Promise.reject(-3);  
	}).then(function(mac) {  
		giikerutil.log('[gancube] init, found cube bluetooth hardware MAC = ' + mac);  
		deviceMac = mac;  
	}, function(err) {  
		giikerutil.log('[gancube] init, unable to automatically determine cube MAC, error code = ' + err);  
	}).then(function() {  
		return device.gatt.connect();  
	}).then(function(gatt) {  
		_gatt = gatt;  
		return gatt.getPrimaryServices();  
	}).then(function(services) {  
		_service_v2data = GiikerCube.findUUID(services, SERVICE_UUID_V2DATA);  
		if (_service_v2data) {  
			return v2init((deviceName || '').startsWith('AiCube') ? 1 : 0);  
		}  
		_service_v3data = GiikerCube.findUUID(services, SERVICE_UUID_V3DATA);  
		if (_service_v3data) {  
			return v3init();  
		}  
		_service_v4data = GiikerCube.findUUID(services, SERVICE_UUID_V4DATA);  
		if (_service_v4data) {  
			return v4init();  
		}  
		_service_meta = GiikerCube.findUUID(services, SERVICE_UUID_META);  
		_service_data = GiikerCube.findUUID(services, SERVICE_UUID_DATA);  
		if (_service_data && _service_meta) {  
			return v1init();  
		}  
		logohint.push(LGHINT_BTNOTSUP);  
	});  
}  

var prevMoves = [];  
var timeOffs = [];  
var moveBuffer = []; // [ [moveCnt, move, ts, locTime], ... ]  
var prevCubie = new mathlib.CubieCube();  
var curCubie = new mathlib.CubieCube();  
var latestFacelet = mathlib.SOLVED_FACELET;  
var deviceTime = 0;  
var deviceTimeOffset = 0;  
var moveCnt = -1;  
var prevMoveCnt = -1;  
var prevMoveLocTime = null;  
var movesFromLastCheck = 1000;  
var batteryLevel = 0;  

function initCubeState() {  
	var locTime = $.now();  
	giikerutil.log('[gancube]', 'init cube state');  
	GiikerCube.callback(latestFacelet, [], [null, locTime], deviceName);  
	prevCubie.fromFacelet(latestFacelet);  
	prevMoveCnt = moveCnt;  
	if (latestFacelet != kernel.getProp('giiSolved', mathlib.SOLVED_FACELET)) {  
		var rst = kernel.getProp('giiRST');  
		if (rst == 'a' || rst == 'p' && confirm(CONFIRM_GIIRST)) {  
			giikerutil.markSolved();  
		}  
	}  
}  

function checkState() {  
	if (movesFromLastCheck < 50) {  
		return Promise.resolve(false);  
	}  
	return _chrct_f2.readValue().then(function(value) {  
		value = decode(value);  
		var state = [];  
		for (var i = 0; i < value.length - 2; i += 3) {  
			var face = value[i ^ 1] << 16 | value[i + 1 ^ 1] << 8 | value[i + 2 ^ 1];  
			for (var j = 21; j >= 0; j -= 3) {  
				state.push("URFDLB".charAt(face >> j & 0x7));  
				if (j == 12) {  
					state.push("URFDLB".charAt(i / 3));  
				}  
			}  
		}  
		latestFacelet = state.join("");  
		movesFromLastCheck = 0;  
		if (prevMoveCnt == -1) {  
			initCubeState();  
			return;  
		}  
		return Promise.resolve(true);  
	});  
}  

function updateMoveTimes(locTime, isV2) {  
	var moveDiff = (moveCnt - prevMoveCnt) & 0xff;  
	moveDiff > 1 && giikerutil.log('[gancube]', 'bluetooth event was lost, moveDiff = ' + moveDiff);  
	prevMoveCnt = moveCnt;  
	movesFromLastCheck += moveDiff;  
	if (moveDiff > prevMoves.length) {  
		movesFromLastCheck = 50;  
		moveDiff = prevMoves.length;  
	}  
	var calcTs = deviceTime + deviceTimeOffset;  
	for (var i = moveDiff - 1; i >= 0; i--) {  
		calcTs += timeOffs[i];  
	}  
	if (!deviceTime || Math.abs(locTime - calcTs) > 2000) {  
		giikerutil.log('[gancube]', 'time adjust', locTime - calcTs, '@', locTime);  
		deviceTime += locTime - calcTs;  
	}  
	for (var i = moveDiff - 1; i >= 0; i--) {  
		var m = "URFDLB".indexOf(prevMoves[i][0]) * 3 + " 2'".indexOf(prevMoves[i][1]);  
		mathlib.CubieCube.CubeMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);  
		deviceTime += timeOffs[i];  
		GiikerCube.callback(curCubie.toFaceCube(), prevMoves.slice(i), [deviceTime, i == 0 ? locTime : null], deviceName + (isV2 ? '*' : ''));  
		var tmp = curCubie;  
		curCubie = prevCubie;  
		prevCubie = tmp;  
		giikerutil.log('[gancube] move', prevMoves[i], timeOffs[i]);  
	}  
	deviceTimeOffset = locTime - deviceTime;  
}  

function loopRead() {  
	if (!_gatt) {  
		return;  
	}  
	return _chrct_f5.readValue().then(function(value) {  
		value = decode(value);  
		var locTime = $.now();  
		moveCnt = value[12];  
		if (moveCnt == prevMoveCnt) {  
			return;  
		}  
		prevMoves = [];  
		for (var i = 0; i < 6; i++) {  
			var m = value[13 + i];  
			prevMoves.unshift("URFDLB".charAt(~~(m / 3)) + " 2'".charAt(m % 3));  
		}  
		var f6val;  
		return _chrct_f6.readValue().then(function(value) {  
			value = decode(value);  
			f6val = value;  
			return checkState();  
		}).then(function(isUpdated) {  

			if (isUpdated) {  
				giikerutil.log('[gancube]', 'facelet state calc', prevCubie.toFaceCube());  
				giikerutil.log('[gancube]', 'facelet state read', latestFacelet);  
				if (prevCubie.toFaceCube() != latestFacelet) {  
					giikerutil.log('[gancube]', 'Cube state check error');  
				}  
				return;  
			}  

			timeOffs = [];  
			for (var i = 0; i < 9; i++) {  
				var off = f6val[i * 2 + 1] | f6val[i * 2 + 2] << 8;  
				timeOffs.unshift(off);  
			}  
			updateMoveTimes(locTime, 0);  

		});  
	}).then(loopRead);  
}  

function getBatteryLevel() {  
	if (!_gatt) {  
		return Promise.reject("Bluetooth Cube is not connected");  
	}  
	if (_service_v2data || _service_v3data || _service_v4data) {  
		return Promise.resolve([batteryLevel, deviceName + '*']);  
	} else if (_chrct_f7) {  
		return _chrct_f7.readValue().then(function(value) {  
			value = decode(value);  
			return Promise.resolve([value[7], deviceName]);  
		});  
	} else {  
		return Promise.resolve([batteryLevel, deviceName]);  
	}  
}  

var keyCheck = 0;  

function onStateChangedV2(event) {  
	var value = event.target.value;  
	if (decoder == null) {  
		return;  
	}  
	parseV2Data(value);  
}  

function parseV2Data(value) {  
	var locTime = $.now();  
	value = decode(value);  
	for (var i = 0; i < value.length; i++) {  
		value[i] = (value[i] + 256).toString(2).slice(1);  
	}  
	value = value.join('');  
	var mode = parseInt(value.slice(0, 4), 2);  
	if (mode == 1) { // gyro  
	} else if (mode == 2) { // cube move  
		giikerutil.log('[gancube]', 'v2 received move event', value);  
		moveCnt = parseInt(value.slice(4, 12), 2);  
		if (moveCnt == prevMoveCnt || prevMoveCnt == -1) {  
			return;  
		}  
		timeOffs = [];  
		prevMoves = [];  
		var keyChkInc = 0;  
		for (var i = 0; i < 7; i++) {  
			var m = parseInt(value.slice(12 + i * 5, 17 + i * 5), 2);  
			timeOffs[i] = parseInt(value.slice(47 + i * 16, 63 + i * 16), 2);  
			prevMoves[i] = "URFDLB".charAt(m >> 1) + " '".charAt(m & 1);  
			if (m >= 12) { // invalid data  
				prevMoves[i] = "U ";  
				keyChkInc = 1;  
			}  
		}  
		keyCheck += keyChkInc;  
		if (keyChkInc == 0) {  
			updateMoveTimes(locTime, 1);  
		}  
	} else if (mode == 4) { // cube state  
		giikerutil.log('[gancube]', 'v2 received facelets event', value);  
		if (prevMoveCnt != -1)  
			return;  
		moveCnt = parseInt(value.slice(4, 12), 2);  
		var cc = new mathlib.CubieCube();  
		var echk = 0;  
		var cchk = 0xf00;  
		for (var i = 0; i < 7; i++) {  
			var perm = parseInt(value.slice(12 + i * 3, 15 + i * 3), 2);  
			var ori = parseInt(value.slice(33 + i * 2, 35 + i * 2), 2);  
			cchk -= ori << 3;  
			cchk ^= perm;  
			cc.ca[i] = ori << 3 | perm;  
		}  
		cc.ca[7] = (cchk & 0xff8) % 24 | cchk & 0x7;  
		for (var i = 0; i < 11; i++) {  
			var perm = parseInt(value.slice(47 + i * 4, 51 + i * 4), 2);  
			var ori = parseInt(value.slice(91 + i, 92 + i), 2);  
			echk ^= perm << 1 | ori;  
			cc.ea[i] = perm << 1 | ori;  
		}  
		cc.ea[11] = echk;  
		if (cc.verify() != 0) {  
			keyCheck++;  
			giikerutil.log('[gancube]', 'v2 facelets state verify error');  
			return;  
		}  
		latestFacelet = cc.toFaceCube();  
		giikerutil.log('[gancube]', 'v2 facelets event state parsed', latestFacelet);  
		initCubeState();  
	} else if (mode == 5) { // hardware info  
		giikerutil.log('[gancube]', 'v2 received hardware info event', value);  
		var hardwareVersion = parseInt(value.slice(8, 16), 2) + "." + parseInt(value.slice(16, 24), 2);  
		var softwareVersion = parseInt(value.slice(24, 32), 2) + "." + parseInt(value.slice(32, 40), 2);  
		var devNa