//index.js
//获取应用实例
const util = require('../../utils/util.js')

Page({
  data: {
    loading: false,
    canvas: null,
    threshold: 128,
    invertColors: false,
    convertImageHexString: '',
    // when send bluethood data , one array length
    splitSendDataLength: 8,
    // choose image
    chooseImageInfo: null,
    // display screen
    fixedSize: {
      width: 128,
      height: 64
    },
    // display options
    clearDisplay: false,
    stopscroll: false,
    startscrollleft: false,
    startscrollleft_avg1: '0x00',
    startscrollleft_avg2: '0xFF',
    startscrollright: false,
    startscrollright_avg1: '0x00',
    startscrollright_avg2: '0xFF',
    println_is: false,
    println_text: 'HELLO WORLD',
    println_fontSize: 1,
    println_font_cursor_x: 1,
    println_font_cursor_y: 1,
  },
  toLogScreen: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  bindFormInput: function (e) {
    const feildType = e.currentTarget.dataset.type
    const feildName = e.currentTarget.dataset.name
    if (feildName === 'threshold') {
      return this.setData({
        [feildName]: isNaN(parseInt(e.detail.value)) ? 128 : parseInt(e.detail.value)
      })
    }
    if (feildType === 'bool') {
      return this.setData({
        [feildName]: !this.data[feildName]
      })
    }
    if (feildType === 'input') {
      return this.setData({
        [feildName]: e.detail.value
      })
    }
  },
  onChooseImage: async function () {
    const selectImageRes = await util.wxAsyncPromise('chooseImage', {
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    })
    console.log('chooseImage', selectImageRes.errMsg, selectImageRes.tempFilePaths)
    if (selectImageRes._fail || !selectImageRes.tempFilePaths || !selectImageRes.tempFilePaths.length) return
    const selectImagePath = selectImageRes.tempFilePaths[0]
    const imageInfoRes = await util.wxAsyncPromise('getImageInfo', {
      src: selectImagePath
    })
    if (imageInfoRes._fail) return
    console.log('get image info', imageInfoRes.errMsg, imageInfoRes.path)
    this.setData({
      chooseImageInfo: imageInfoRes
    })
    return imageInfoRes
  },
  onInitCanvas: function () {
    const query = wx.createSelectorQuery()
    query.select('#canvas_box')
      .fields({
        id: true,
        node: true,
        size: true
      })
      .exec((res) => {
        console.log('res', res)
        const canvas = res[0].node
        // const ctx = canvas.getContext('2d')
        // const dpr = wx.getSystemInfoSync().pixelRatio
        const dpr = 1;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        // ctx.scale(dpr, dpr);
        this.setData({
          canvas,
        });
        console.log('init canvas success')
        // this.onChooseImageWithDraw();
      });
  },
  onDrawImage: async function (imagePath, imageWidth, imageHeight, ) {
    const drawCanvas = this.data.canvas
    if (!drawCanvas) return
    const ctx = drawCanvas.getContext('2d')
    const drawImgObj = drawCanvas.createImage();
    const drawImageSize = this.data.fixedSize
    drawImgObj.onload = () => {
      console.log('canvas image load status', drawImgObj.complete)
      if (drawImgObj.complete) {

        const wBh = imageWidth / imageHeight
        const isWidthMain = imageWidth > imageHeight

        const calcWidth = isWidthMain ? drawImageSize.width : wBh * drawImageSize.height
        const calcHeight = isWidthMain ? drawImageSize.width / wBh : drawImageSize.height

        const originalX = (drawImageSize.width - calcWidth) / 2
        const originalY = (drawImageSize.height - calcHeight) / 2

        ctx.fillStyle = "rgba(0,0,0,0.0)";
        ctx.globalCompositeOperation = 'copy';
        ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.drawImage(drawImgObj, originalX, originalY, calcWidth, calcHeight);
      }
    };
    drawImgObj.src = imagePath;
  },
  onChooseImageWithDraw: async function () {
    const chooseImageInfo = await this.onChooseImage()
    if (!chooseImageInfo) return
    await this.onDrawImage(chooseImageInfo.path, chooseImageInfo.width, chooseImageInfo.height)
  },
  // 图片黑白处理
  onConvertImage: async function () {
    if (!this.data.chooseImageInfo) return
    const drawCanvas = this.data.canvas
    if (!drawCanvas) return
    const ctx = drawCanvas.getContext('2d')
    const threshold = this.data.threshold
    const invertColors = this.data.invertColors
    this.setData({
      loading: true
    })
    const imageData = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      avg > threshold ? avg = 255 : avg = 0;
      data[i] = invertColors ? 255 - avg : avg; // red
      data[i + 1] = invertColors ? 255 - avg : avg; // green
      data[i + 2] = invertColors ? 255 - avg : avg; // blue
    }
    ctx.putImageData(imageData, 0, 0);
    this.setData({
      loading: false
    })
  },
  getDrawImageData: function () {
    if (!this.data.chooseImageInfo) return null
    const drawCanvas = this.data.canvas
    if (!drawCanvas) return null
    const splitArrayLength = this.data.splitSendDataLength
    const drawImageSize = this.data.fixedSize
    const ctx = drawCanvas.getContext('2d')
    this.setData({
      loading: true
    })
    const imageData = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    const bleData = util.uint8ClampedArrayToHexString(imageData.data, drawImageSize.width, drawImageSize.height)
    this.setData({
      convertImageHexString: bleData
    })
    // split string and group arr , splitArrayLength unit
    return bleData
      .replace('\n', '')
      .split(',')
      .filter(b => b.includes('0'))
      .reduce((arr, unit) => {
        if (arr.length === 0 || arr[arr.length - 1].length >= splitArrayLength)
          arr.push([])
        const lastUnitArr = arr.pop()
        lastUnitArr.push(unit)
        arr.push(lastUnitArr)
        return arr
      }, [])
  },
  onWirteByBle: async function () {
    // obj => {cmd:data}
    const blueData = []
    const sortCmd = ['clearDisplay', 'println', 'drawBitmap', 'startscrollleft', 'startscrollright', 'stopscroll']
    sortCmd.forEach(cmd => {
      switch (cmd) {
        case 'clearDisplay':
        case 'stopscroll':
          if (this.data[cmd]) {
            blueData.push({
              [cmd]: []
            })
          }
          break;
        case 'startscrollleft':
        case 'startscrollright':
          if (this.data[cmd]) {
            blueData.push({
              [cmd]: [this.data[`${cmd}_avg1`], this.data[`${cmd}_avg2`]]
            })
          }
          break;
        case 'println':
          if (this.data.println_is) {
            blueData.push({
              [cmd]: {
                params: [this.data.println_fontSize, this.data.println_font_cursor_x, this.data.println_font_cursor_y],
                extra: this.data.println_text
              }
            })
          }
          break;
        case 'drawBitmap':
          const imageData = this.getDrawImageData()
          if (imageData) {
            blueData.push({
              [cmd]: imageData
            })
          }
          break;
        default:
          break;
      }
    })
    console.log('blueData', blueData)
    // for send blueData
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('onSendBleData', blueData);
  },
  onReady: function () {
    this.onInitCanvas()
  },
})