<template>
  <v-app>
    <v-main class="display-main">
      <v-container v-if="loading" fluid class="fill-height">
        <v-row align="center" justify="center" class="fill-height">
          <v-col cols="12" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-col>
        </v-row>
      </v-container>
      <v-container v-else fluid class="content-container">
        <v-alert
          v-if="errorMessage"
          type="error"
          border="left"
          colored-border
          class="mb-4"
        >
          <div class="d-flex align-center justify-space-between flex-wrap">
            <span>{{ errorMessage }}</span>
            <div v-if="apiConfigured" class="mt-2 mt-sm-0">
              <v-btn color="primary" @click="retry" outlined small>Retry</v-btn>
            </div>
          </div>
          <div v-if="errorDetails" class="error-details mt-2">
            {{ errorDetails }}
          </div>
        </v-alert>
        <router-view
          :guest-name="guestName"
          :property="property"
          :booking="booking"
          :wifi-qr="wifiQR"
          :checkout-policies="checkoutPolicies"
          :property-rules="propertyRules"
          :offline="fallbackActive"
        ></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import api from './services/api'

const OFFLINE_FALLBACK = (propertyID) => ({
  property: {
    id: propertyID,
    name: 'Welcome!',
    address: 'Property information is currently unavailable.'
  },
  checkoutPolicies: [
    {
      title: 'Need help checking out?',
      content: 'Please contact your host using the information provided in your welcome packet.'
    }
  ],
  propertyRules: [
    {
      title: 'Quiet Hours',
      content: 'Please be mindful between 10:00 PM and 7:00 AM.'
    },
    {
      title: 'No Smoking',
      content: 'This is a smoke-free property. Thank you for keeping it fresh.'
    }
  ]
})

export default {
  name: 'App',
  data () {
    return {
      loading: true,
      error: null,
      guestName: '',
      property: null,
      booking: null,
      propertyID: parseInt(process.env.VUE_APP_PROPERTY_ID || '1', 10),
      wifiQR: null,
      checkoutPolicies: [],
      propertyRules: [],
      fallbackActive: false
    }
  },
  mounted () {
    this.loadData()
    if (this.hasWsConfig) {
      this.$ws.connect(this.propertyID)
    }
  },
  methods: {
    async loadData () {
      if (!this.apiConfigured) {
        this.applyOfflineFallback({
          code: 'NO_API_CONFIG',
          message: 'No API endpoint configured. Set VUE_APP_API_URL in Netlify environment variables.'
        })
        return
      }

      try {
        const [propertyData, wifiData] = await Promise.all([
          api.getPropertyData(this.propertyID),
          api.getWiFiQR(this.propertyID)
        ])

        const propertyPayload = propertyData?.property ? propertyData : { property: propertyData }

        this.property = propertyPayload.property || null
        this.booking = propertyPayload.booking || null
        if (this.booking) {
          this.guestName = this.booking.guest_name || ''
        }
        this.checkoutPolicies = propertyPayload.checkout_policies || []
        this.propertyRules = propertyPayload.property_rules || []
        this.wifiQR = wifiData && (wifiData.qr_code || wifiData.url || wifiData) ? (wifiData.qr_code || wifiData.url || wifiData) : null
        this.loading = false
        this.error = null
        this.fallbackActive = false
      } catch (error) {
        console.error('Data load failed:', error)
        this.applyOfflineFallback({
          message: 'Unable to reach the PropertySync API. Displaying offline content.',
          details: error?.message || String(error)
        })
      }
    },
    retry () {
      if (this.hasWsConfig) {
        this.$ws.disconnect()
        this.$ws.connect(this.propertyID)
      }
      this.loading = true
      this.error = null
      this.fallbackActive = false
      this.loadData()
    },
    applyOfflineFallback (errorInfo) {
      const fallback = OFFLINE_FALLBACK(this.propertyID)
      this.property = fallback.property
      this.booking = null
      this.guestName = ''
      this.checkoutPolicies = fallback.checkoutPolicies
      this.propertyRules = fallback.propertyRules
      this.wifiQR = null
      this.loading = false
      this.fallbackActive = true
      this.error = errorInfo
      if (this.hasWsConfig) {
        this.$ws.disconnect()
      }
    }
  },
  computed: {
    apiConfigured () {
      return Boolean(process.env.VUE_APP_API_URL)
    },
    wsConfigured () {
      return Boolean(process.env.VUE_APP_WS_URL)
    },
    hasWsConfig () {
      return this.wsConfigured && Boolean(this.propertyID)
    },
    errorMessage () {
      if (!this.error) {
        return ''
      }
      if (this.error.code === 'NO_API_CONFIG') {
        return this.error.message
      }
      return this.error.message || 'Unable to reach the PropertySync API. Displaying offline content.'
    },
    errorDetails () {
      return this.error && this.error.details ? this.error.details : ''
    }
  },
  beforeDestroy () {
    if (this.hasWsConfig) {
      this.$ws.disconnect()
    }
  }
}
</script>

<style>
.display-main {
  background: #f5f5f5;
}
.fill-height {
  height: 100vh;
}
.content-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.error-details {
  opacity: 0.75;
  font-size: 0.85rem;
}
.offline-card {
  max-width: 420px;
  margin: 0 auto;
}
</style>

