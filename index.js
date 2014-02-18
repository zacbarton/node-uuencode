/* jshint node: true */
/* jshint bitwise:false */

'use strict';

function encode(inString) {
	var inBytes = new Buffer(inString);
	var buffLen = inBytes.length;
	var outBuffer = new Buffer(buffLen + buffLen / 3 + 1 + buffLen / 45 * 2 + 2 + 4);

	var stop = false;
	var outIndex = 0;
	var bytesRead = 0;
	var bufOffset = 0;

	do {
		var n;
		var bytesLeft = buffLen - bytesRead;

		if (bytesLeft === 0) break;

		if (bytesLeft <= 45) {
			n = bytesLeft;
		} else {
			n = 45;
		}

		outBuffer[outIndex++] = (n & 0x3F) + 32;

		for (var i = 0; i < n; i += 3) {
			if (buffLen - bufOffset < 3) {
				var padding = new Buffer(3);
				var z = 0;

				while (bufOffset + z < buffLen) {
					padding[z] = inBytes[bufOffset + z];
					++z;
				}

				encodeBytes(padding, 0, outBuffer, outIndex);
			} else {
				encodeBytes(inBytes, bufOffset, outBuffer, outIndex);
			}

			outIndex += 4;
			bufOffset += 3;
		}

		outBuffer[outIndex++] = 10;

		bytesRead += n;

		if (n >= 45) continue;

		stop = true;
	} while (!stop);

	return outBuffer.toString().substring(0, outIndex);
}

function decode(inString) {
	var curPos = 0;
	var stop = false;
	var totalLen = 0;
	var byteOffset = 0;

	var inBytes = new Buffer(inString);
	var buffLen = inBytes.length;
	var outBytes = new Buffer(buffLen);

	do {
		if (curPos < buffLen) {
			var n = inBytes[curPos] - 32 & 0x3F;

			++curPos;

			if (n > 45) {
				throw 'Invalid Data';
			}

			if (n < 45) {
				stop = true;
			}

			totalLen += n;

			while (n > 0) {
				decodeChars(inBytes, curPos, outBytes, byteOffset);
				byteOffset += 3;
				curPos += 4;
				n -= 3;
			}

			++curPos;
		} else {
			stop = true;
		}
	} while (!stop);

	var retVal = new Buffer(totalLen);

	for (var i = 0; i < totalLen; i++) {
		retVal[i] = outBytes[i];
	}

	return retVal.toString();
}
	
function encodeBytes(inBytes, offset, outBuffer, outIndex) {
	var c1 = inBytes[offset] >>> 2;
	var c2 = inBytes[offset] << 4 & 0x30 | inBytes[offset + 1] >>> 4 & 0xF;
	var c3 = inBytes[offset + 1] << 2 & 0x3C | inBytes[offset + 2] >>> 6 & 0x3;
	var c4 = inBytes[offset + 2] & 0x3F;

	outBuffer[outIndex] = (c1 & 0x3F) + 32;
	outBuffer[outIndex + 1] = (c2 & 0x3F) + 32;
	outBuffer[outIndex + 2] = (c3 & 0x3F) + 32;
	outBuffer[outIndex + 3] = (c4 & 0x3F) + 32;
}

function decodeChars(inBytes, inOffset, outBytes, byteOffset) {
	var c1 = inBytes[inOffset];
	var c2 = inBytes[inOffset + 1];
	var c3 = inBytes[inOffset + 2];
	var c4 = inBytes[inOffset + 3];

	var b1 = (c1 - 32 & 0x3F) << 2 | (c2 - 32 & 0x3F) >> 4;
	var b2 = (c2 - 32 & 0x3F) << 4 | (c3 - 32 & 0x3F) >> 2;
	var b3 = (c3 - 32 & 0x3F) << 6 | c4 - 32 & 0x3F;

	outBytes[byteOffset] = b1;
	outBytes[byteOffset + 1] = b2;
	outBytes[byteOffset + 2] = b3;
}

exports.encode = encode;
exports.decode = decode;