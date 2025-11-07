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
            <div class="mt-2 mt-sm-0 d-flex flex-wrap align-center">
              <v-btn
                v-if="apiConfigured"
                color="primary"
                @click="retry"
                outlined
                small
                class="mr-2 mb-2"
              >
                Retry
              </v-btn>
              <v-btn
                v-if="requiresCredentialSetup"
                color="secondary"
                outlined
                small
                class="mb-2"
                @click="openCredentialDialog"
              >
                Update Credentials
              </v-btn>
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
        <v-btn
          v-if="!loading"
          color="primary"
          dark
          fab
          small
          class="config-button"
          @click="openCredentialDialog"
        >
          <v-icon small>mdi-cog</v-icon>
        </v-btn>
        <v-dialog v-model="credentialsDialog" persistent max-width="480">
          <v-card>
            <v-card-title class="headline">Configure Display Access</v-card-title>
            <v-card-text>
              <p class="mb-4">
                Enter the display token and secret generated in HostSync for this property.
              </p>
              <v-text-field
                v-model="credentialsForm.token"
                label="Display Token"
                outlined
                required
                hide-details="auto"
                autocomplete="off"
              ></v-text-field>
              <v-text-field
                v-model="credentialsForm.secret"
                label="Display Secret"
                outlined
                required
                hide-details="auto"
                autocomplete="off"
              ></v-text-field>
              <v-alert
                v-if="credentialsError"
                type="error"
                dense
                class="mt-3"
              >
                {{ credentialsError }}
              </v-alert>
            </v-card-text>
            <v-card-actions>
              <v-btn
                v-if="hasStoredCredentials"
                text
                color="secondary"
                @click="clearStoredCredentials"
              >
                Clear Saved Credentials
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn text @click="credentialsDialog = false">Cancel</v-btn>
              <v-btn
                color="primary"
                :loading="credentialsSaving"
                @click="saveCredentials"
              >
                Save &amp; Connect
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import api from './services/api'

const OFFLINE_FALLBACK = (propertyID) => ({
  property: {
    id: propertyID ?? 'unknown',
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

const STORAGE_KEY = 'propertysync.displayCredentials'

export default {
  name: 'App',
  data () {
    return {
      loading: true,
      error: null,
      guestName: '',
      property: null,
      booking: null,
      propertyID: null,
      wifiQR: null,
      checkoutPolicies: [],
      propertyRules: [],
      fallbackActive: false,
      handshakeMetadata: null,
      displayToken: process.env.VUE_APP_DISPLAY_TOKEN || '',
      displaySecret: process.env.VUE_APP_DISPLAY_SECRET || '',
      hasStoredCredentials: false,
      credentialsDialog: false,
      credentialsSaving: false,
      credentialsForm: {
        token: '',
        secret: ''
      },
      credentialsError: ''
    }
  },
  computed: {
    apiConfigured () {
      return Boolean(process.env.VUE_APP_API_URL)
    },
    wsConfigured () {
      return Boolean(process.env.VUE_APP_WS_URL)
    },
    credentialsConfigured () {
      return Boolean(this.displayToken && this.displaySecret)
    },
    hasWsConfig () {
      return this.wsConfigured && Boolean(this.propertyID)
    },
    requiresCredentialSetup () {
      return Boolean(this.error && ['MISSING_DISPLAY_CREDENTIALS', 'INVALID_DISPLAY_CREDENTIALS'].includes(this.error.code))
    },
    errorMessage () {
      if (!this.error) {
        return ''
      }
      if (['NO_API_CONFIG', 'MISSING_DISPLAY_CREDENTIALS', 'INVALID_DISPLAY_CREDENTIALS'].includes(this.error.code)) {
        return this.error.message
      }
      return this.error.message || 'Unable to reach the PropertySync API. Displaying offline content.'
    },
    errorDetails () {
      return this.error && this.error.details ? this.error.details : ''
    }
  },
  mounted () {
    this.bootstrapCredentials()
    this.initializeDisplay()
  },
  methods: {
    bootstrapCredentials () {
      const stored = this.loadStoredCredentials()
      if (stored) {
        this.displayToken = stored.token
        this.displaySecret = stored.secret
        this.hasStoredCredentials = true
        api.setDisplayCredentials(stored.token, stored.secret)
      } else if (this.displayToken && this.displaySecret) {
        api.setDisplayCredentials(this.displayToken, this.displaySecret)
      } else {
        api.setDisplayCredentials('', '')
      }
    },
    loadStoredCredentials () {
      if (typeof window === 'undefined') {
        return null
      }
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          return null
        }
        const parsed = JSON.parse(raw)
        if (parsed && parsed.token && parsed.secret) {
          return {
            token: parsed.token,
            secret: parsed.secret
          }
        }
      } catch (error) {
        console.warn('Failed to load stored display credentials', error)
      }
      return null
    },
    persistCredentials (token, secret) {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, secret }))
        } catch (error) {
          console.warn('Failed to persist display credentials', error)
        }
      }
      this.hasStoredCredentials = true
      api.setDisplayCredentials(token, secret)
    },
    clearStoredCredentials () {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
          console.warn('Failed to clear stored credentials', error)
        }
      }
      this.hasStoredCredentials = false
      this.displayToken = ''
      this.displaySecret = ''
      this.propertyID = null
      this.handshakeMetadata = null
      api.setDisplayCredentials('', '')
      this.credentialsForm = { token: '', secret: '' }
      this.applyOfflineFallback({
        code: 'MISSING_DISPLAY_CREDENTIALS',
        message: 'Display token and secret are not configured. Enter new credentials to connect.'
      })
      this.openCredentialDialog()
    },
    openCredentialDialog () {
      this.credentialsError = ''
      this.credentialsForm = {
        token: this.displayToken || '',
        secret: this.displaySecret || ''
      }
      this.credentialsDialog = true
    },
    async saveCredentials () {
      if (this.credentialsSaving) {
        return
      }

      const token = (this.credentialsForm.token || '').trim()
      const secret = (this.credentialsForm.secret || '').trim()

      if (!token || !secret) {
        this.credentialsError = 'Token and secret are required.'
        return
      }

      this.credentialsSaving = true
      this.displayToken = token
      this.displaySecret = secret
      this.propertyID = null
      this.handshakeMetadata = null
      this.persistCredentials(token, secret)
      this.credentialsDialog = false
      this.credentialsSaving = false
      this.error = null
      this.fallbackActive = false
      this.initializeDisplay()
    },
    async initializeDisplay () {
      if (!this.apiConfigured) {
        this.applyOfflineFallback({
          code: 'NO_API_CONFIG',
          message: 'No API endpoint configured. Set VUE_APP_API_URL in Netlify environment variables.'
        })
        return
      }

      if (!this.credentialsConfigured) {
        this.applyOfflineFallback({
          code: 'MISSING_DISPLAY_CREDENTIALS',
          message: 'Display token and secret are not configured. Provide credentials to connect.'
        })
        return
      }

      this.loading = true
      this.error = null

      try {
        const auth = await api.authenticateDisplay(this.displayToken, this.displaySecret)
        this.propertyID = auth?.property_id || null
        this.handshakeMetadata = auth || null
        this.connectWebsocket()
        await this.loadData()
      } catch (error) {
        const status = error?.response?.status
        if (status === 401) {
          this.applyOfflineFallback({
            code: 'INVALID_DISPLAY_CREDENTIALS',
            message: 'Display credentials were rejected by HostSync. Rotate them in HostSync and update the kiosk.',
            details: error?.response?.data?.error || error?.message || ''
          })
        } else {
          this.applyOfflineFallback({
            code: 'DISPLAY_AUTH_FAILED',
            message: 'Unable to authenticate with HostSync. Displaying offline content.',
            details: error?.message || 'Unknown authentication error'
          })
        }
      }
    },
    async loadData () {
      if (!this.apiConfigured) {
        this.applyOfflineFallback({
          code: 'NO_API_CONFIG',
          message: 'No API endpoint configured. Set VUE_APP_API_URL in Netlify environment variables.'
        })
        return
      }

      if (!this.propertyID) {
        this.loading = false
        return
      }

      try {
        const propertyResponse = await api.getPropertyData()
        const wifiResponse = await api.getWiFiQR().catch(err => {
          console.error('Failed to load WiFi QR code:', err)
          return null
        })

        const propertyPayload = propertyResponse?.property ? propertyResponse : { property: propertyResponse }

        this.property = propertyPayload.property || null
        this.booking = propertyPayload.booking || null
        this.guestName = this.booking ? (this.booking.guest_name || '') : ''
        this.checkoutPolicies = propertyPayload.checkout_policies || []
        this.propertyRules = propertyPayload.property_rules || []
        if (wifiResponse) {
          this.wifiQR = wifiResponse.qr_code || wifiResponse.url || wifiResponse
        } else {
          this.wifiQR = null
        }

        this.loading = false
        this.error = null
        this.fallbackActive = false
      } catch (error) {
        console.error('Data load failed:', error)
        this.applyOfflineFallback({
          code: 'DATA_FETCH_FAILED',
          message: 'Unable to reach the PropertySync API. Displaying offline content.',
          details: error?.message || String(error)
        })
      }
    },
    async retry () {
      this.loading = true
      this.error = null
      this.fallbackActive = false
      await this.initializeDisplay()
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
      this.teardownWebsocket()

      if (errorInfo && ['MISSING_DISPLAY_CREDENTIALS', 'INVALID_DISPLAY_CREDENTIALS'].includes(errorInfo.code)) {
        this.$nextTick(() => {
          if (!this.credentialsDialog) {
            this.openCredentialDialog()
          }
        })
      }
    },
    connectWebsocket () {
      if (!this.wsConfigured || !this.propertyID) {
        return
      }
      this.$ws.disconnect()
      this.$ws.connect(this.propertyID)
    },
    teardownWebsocket () {
      if (this.wsConfigured) {
        this.$ws.disconnect()
      }
    }
  },
  watch: {
    credentialsDialog (value) {
      if (!value) {
        this.credentialsError = ''
        this.credentialsSaving = false
      }
    }
  },
  beforeDestroy () {
    this.teardownWebsocket()
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
.config-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
}
</style>

