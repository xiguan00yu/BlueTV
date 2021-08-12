//app.js
App({
  onLaunch: function () {
    wx.setStorageSync('logs', [])
    const consoleLog = console.log
    console.log = function (...msgs) {
      consoleLog.apply(this, msgs)
      const log = msgs.length > 0 ? msgs.join(',') : `${msgs}`
      const storageLogs = wx.getStorageSync('logs') || []
      storageLogs.push(log)
      wx.setStorageSync('logs', storageLogs)
    }
  },
  globalData: {
    connectBluetooth: null
  }
})