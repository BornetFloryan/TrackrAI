function resolveWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
}

export class AnalysisSocket {
  constructor(url = resolveWsUrl()) {
    this.ws = new WebSocket(url)

    this.ws.onerror = (e) => {
      console.error("WebSocket error", e)
    }

    this.ws.onclose = () => {
      console.warn("WebSocket closed")
    }
  }

  waitOpen() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve
      this.ws.onerror = reject
    })
  }

  send(obj) {
    this.ws.send(JSON.stringify(obj))
  }

  onMessage(cb) {
    this.ws.onmessage = (e) => {
      cb(JSON.parse(e.data))
    }
  }

  close() {
    this.ws.close()
  }
}
