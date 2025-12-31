export class AnalysisSocket {
    constructor(url) {
      this.ws = new WebSocket(url)
      this.ws.binaryType = 'arraybuffer'
    }
  
    waitOpen() {
      return new Promise(res => {
        if (this.ws.readyState === WebSocket.OPEN) return res()
        this.ws.onopen = () => res()
      })
    }
  
    sendJson(obj) {
      this.ws.send(JSON.stringify(obj))
    }
  
    sendBinary(buf) {
      this.ws.send(buf)
    }
  
    close() {
      this.ws.close()
    }
  }
  