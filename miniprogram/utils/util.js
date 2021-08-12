const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function wxAsyncPromise(name, options) {
  return new Promise((resolve, reject) => {
    wx[name]({
      ...(options || {}),
      success: function (res) {
        resolve(res);
      },
      fail: function (res) {
        resolve({
          ...res,
          _fail: true
        });
      },
    });
  });
}
/**
 * @param {*} data uint8ClampedArray
 * @param {*} width number
 * @param {*} height number
 */
function uint8ClampedArrayToHexString(data, width, height, threshold = 128) {
  let output_string = "";
  let output_index = 0;

  let byteIndex = 7;
  let number = 0;

  // data format RGBA, move 4 steps
  for (let index = 0; index < data.length; index += 4) {
    // Get the average of the RGB (we ignore A)
    let avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
    if (avg > threshold) {
      number += Math.pow(2, byteIndex);
    }
    byteIndex--;

    // if this was the last pixel of a row or the last pixel of the
    // image, fill up the rest of our byte with zeros so it always contains 8 bits
    if ((index != 0 && (((index / 4) + 1) % (width)) == 0) || (index == data.length - 4)) {
      byteIndex = -1;
    }

    // When complete 8 bits, merge a hex value
    if (byteIndex < 0) {
      let byteSet = number.toString(16);
      if (byteSet.length == 1) {
        byteSet = "0" + byteSet;
      }
      let b = "0x" + byteSet;
      output_string += b + ", ";
      output_index++;
      if (output_index >= 16) {
        output_string += "\n";
        output_index = 0;
      }
      number = 0;
      byteIndex = 7;
    }
  }
  return output_string;
}

/**
 * 
 * @param {*} time 1s
 */
function delay(time = 1) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(1), time * 1000)
  })
}


function str2ab(str) {
  let buf = new ArrayBuffer(str.length * 2);
  let bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function arr2ab(data) {
  const t_buffer = new ArrayBuffer(data.length)
  const t_dv = new DataView(t_buffer)
  data.forEach((b, offset) => t_dv.setUint8(offset, parseInt(b)))
  return t_buffer;
}

/**
 * @param {*} method String
 * @param {*} data 16 number arr
 */
function all2ab(method, data, extra = '', method_sep = '|', data_sep = '-') {
  const isBuildExtra = extra.length !== 0
  const bufLength = method.length + method_sep.length + data.length + (
    isBuildExtra ? extra.length + data_sep.length : 0
  )
  const buf = new ArrayBuffer(bufLength);
  const u8a = new Uint8Array(buf);
  for (let i = 0, strLen = method.length; i < strLen; i++) {
    u8a[i] = method.charCodeAt(i);
  }
  const offset_method_sep = method.length
  for (let i = 0; i < method_sep.length; i++) {
    u8a[offset_method_sep + i] = method_sep.charCodeAt(i);
  }
  const offset_data = method_sep.length + offset_method_sep;
  for (let i = 0, dataLen = data.length; i < dataLen; i++) {
    u8a[offset_data + i] = parseInt(data[i])
  }
  if(isBuildExtra){
    const offset_data_sep = offset_data + data.length
    for (let i = 0; i < data_sep.length; i++) {
      u8a[offset_data_sep + i] = data_sep.charCodeAt(i);
    }
    const offset_extra = data_sep.length + offset_data_sep;
    for (let i = 0, extraLen = extra.length; i < extraLen; i++) {
      u8a[offset_extra + i] = extra.charCodeAt(i);
    }
  }
  return buf
}

module.exports = {
  formatTime,
  wxAsyncPromise,
  uint8ClampedArrayToHexString,
  delay,
  str2ab,
  arr2ab,
  all2ab
}