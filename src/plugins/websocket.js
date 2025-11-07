import Vue from 'vue'

const wsPlugin = {
  install (Vue) {
    if (!Vue.prototype.$bus) {
      Vue.prototype.$bus = new Vue()
    }

    Vue.prototype.$ws = {
      ws: null,
      propertyID: null,
      retryCount: 0,
      maxRetries: 5,
      reconnectTimer: null,
      
      connect (propertyID) {
        if (!propertyID) {
          return
        }

        const rawUrl = process.env.VUE_APP_WS_URL || 'ws://localhost:8080/ws'
        if (!/^wss?:\/\//i.test(rawUrl)) {
          console.warn('WebSocket disabled: invalid URL', rawUrl)
          return
        }

        const wsURL = rawUrl.replace(/\/+$/, '')
        this.propertyID = propertyID
        this.clearReconnectTimer()

        try {
          this.ws = new WebSocket(`${wsURL}/${encodeURIComponent(propertyID)}`)
        } catch (error) {
          console.warn('WebSocket connection failed to initialise', error)
          this.scheduleReconnect()
          return
        }
        
        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.retryCount = 0
        }
        
        this.ws.onmessage = (event) => {
          // Handle real-time updates
          const data = JSON.parse(event.data)
          Vue.prototype.$bus.$emit('property-update', data)
        }
        
        this.ws.onerror = (error) => {
          console.warn('WebSocket error:', error)
        }
        
        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.ws = null
          this.scheduleReconnect()
        }
      },
      
      disconnect () {
        if (this.ws) {
          this.ws.onopen = null
          this.ws.onmessage = null
          this.ws.onerror = null
          this.ws.onclose = null
          this.ws.close()
          this.ws = null
        }
        this.clearReconnectTimer()
        this.retryCount = 0
        this.propertyID = null
      },

      scheduleReconnect () {
        if (!this.propertyID) {
          return
        }

        if (this.retryCount >= this.maxRetries) {
          console.warn('WebSocket disabled after repeated failures')
          return
        }

        const delay = Math.min(5000 * Math.pow(2, this.retryCount), 60000)
        this.retryCount += 1
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.propertyID)
        }, delay)
      },

      clearReconnectTimer () {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }
    }
  }
}

Vue.use(wsPlugin)

