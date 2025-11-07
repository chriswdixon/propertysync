import Vue from 'vue'

const wsPlugin = {
  install (Vue) {
    Vue.prototype.$ws = {
      ws: null,
      propertyID: null,
      
      connect (propertyID) {
        this.propertyID = propertyID
        const wsURL = process.env.VUE_APP_WS_URL || 'ws://localhost:8080/ws'
        this.ws = new WebSocket(`${wsURL}/${propertyID}`)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected')
        }
        
        this.ws.onmessage = (event) => {
          // Handle real-time updates
          const data = JSON.parse(event.data)
          Vue.prototype.$bus.$emit('property-update', data)
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          // Reconnect after 5 seconds
          setTimeout(() => this.connect(propertyID), 5000)
        }
      },
      
      disconnect () {
        if (this.ws) {
          this.ws.close()
        }
      }
    }
  }
}

Vue.use(wsPlugin)

