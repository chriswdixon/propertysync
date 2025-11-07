<template>
  <v-app>
    <v-main class="display-main" :style="displayBackgroundStyle">
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
          @click="handleConfigClick"
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
              <v-alert
                v-if="hasStoredCredentials"
                type="info"
                dense
                outlined
                class="mb-4"
              >
                Saved display credentials are in use. Enter new values below to rotate them.
              </v-alert>
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
        <v-dialog v-model="adminDialog" max-width="420">
          <v-card>
            <v-card-title class="headline">
              <v-icon left color="primary">mdi-shield-account</v-icon>
              Admin Access Required
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pt-6">
              <p class="mb-4">
                Sign in with your HostSync administrator credentials to manage this display.
              </p>
              <v-text-field
                v-model="adminForm.email"
                label="Email"
                outlined
                type="email"
                required
                autocomplete="username"
                hide-details="auto"
              ></v-text-field>
              <v-text-field
                v-model="adminForm.password"
                label="Password"
                outlined
                :type="adminPasswordVisible ? 'text' : 'password'"
                :append-icon="adminPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="adminPasswordVisible = !adminPasswordVisible"
                required
                autocomplete="current-password"
                hide-details="auto"
              ></v-text-field>
              <v-alert
                v-if="adminError"
                type="error"
                dense
                class="mt-3"
              >
                {{ adminError }}
              </v-alert>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="closeAdminDialog" :disabled="adminLoading">Cancel</v-btn>
              <v-btn color="primary" :loading="adminLoading" @click="authenticateAdmin">
                Sign In
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
const ADMIN_SESSION_DURATION_MS = 5 * 60 * 1000

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
      credentialsError: '',
      backgroundImage: '',
      defaultBackgroundImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2000&q=80',
      adminDialog: false,
      adminLoading: false,
      adminError: '',
      adminPasswordVisible: false,
      adminForm: {
        email: '',
        password: ''
      },
      adminAuthorized: false,
      adminSessionExpiresAt: 0
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
    },
    displayBackgroundStyle () {
      const image = this.backgroundImage || this.defaultBackgroundImage
      return {
        '--display-background-image': `url('${image}')`
      }
    }
  },
  mounted () {
    this.bootstrapCredentials()
    this.resetBackgroundImage()
    this.initializeDisplay()
  },
  methods: {
    handleConfigClick () {
      if (!this.hasStoredCredentials && !this.credentialsConfigured) {
        this.openCredentialDialog()
        return
      }

      if (this.hasValidAdminSession()) {
        this.extendAdminSession()
        this.openCredentialDialog()
        return
      }

      this.openAdminDialog()
    },
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
      this.clearAdminSession()
      this.applyOfflineFallback({
        code: 'MISSING_DISPLAY_CREDENTIALS',
        message: 'Display token and secret are not configured. Enter new credentials to connect.'
      })
      this.openCredentialDialog()
    },
    openAdminDialog () {
      this.resetAdminForm()
      this.adminError = ''
      this.adminDialog = true
    },
    closeAdminDialog () {
      this.adminDialog = false
      this.adminLoading = false
      this.adminError = ''
      this.resetAdminForm()
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
    hasValidAdminSession () {
      if (!this.adminAuthorized) {
        return false
      }
      if (!this.adminSessionExpiresAt) {
        return false
      }
      if (Date.now() >= this.adminSessionExpiresAt) {
        this.clearAdminSession()
        return false
      }
      return true
    },
    extendAdminSession () {
      this.adminAuthorized = true
      this.adminSessionExpiresAt = Date.now() + ADMIN_SESSION_DURATION_MS
    },
    clearAdminSession () {
      this.adminAuthorized = false
      this.adminSessionExpiresAt = 0
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
        this.updateBackgroundFromProperty(this.property)
        const wifiCode = this.normalizeWifiResponse(wifiResponse) || this.extractWifiFromProperty(propertyPayload)
        this.wifiQR = wifiCode || null

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
    async authenticateAdmin () {
      if (this.adminLoading) {
        return
      }

      const email = (this.adminForm.email || '').trim()
      const password = (this.adminForm.password || '').trim()

      if (!email || !password) {
        this.adminError = 'Email and password are required.'
        return
      }

      this.adminLoading = true
      this.adminError = ''

      try {
        await api.authenticateAdmin(email, password)
        this.extendAdminSession()
        this.closeAdminDialog()
        this.openCredentialDialog()
      } catch (error) {
        const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unable to authenticate admin credentials. Please try again.'
        this.adminError = message
      } finally {
        this.adminLoading = false
      }
    },
    resetAdminForm () {
      this.adminForm = {
        email: '',
        password: ''
      }
      this.adminPasswordVisible = false
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
      this.resetBackgroundImage()
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
    },
    resetBackgroundImage () {
      this.backgroundImage = this.defaultBackgroundImage
    },
    updateBackgroundFromProperty (property) {
      const candidate = this.extractPropertyImage(property)
      this.backgroundImage = candidate || this.defaultBackgroundImage
    },
    extractPropertyImage (property) {
      if (!property || typeof property !== 'object') {
        return ''
      }

      const directKeys = [
        'display_background_image_url',
        'displayBackgroundImageUrl',
        'display_background_image',
        'displayBackgroundImage',
        'hero_image_url',
        'heroImageUrl',
        'primary_image_url',
        'primaryImageUrl',
        'cover_image_url',
        'coverImageUrl',
        'featured_image_url',
        'featuredImageUrl',
        'image_url',
        'imageUrl',
        'photo_url',
        'photoUrl',
        'background_image_url',
        'backgroundImageUrl'
      ]

      for (const key of directKeys) {
        const value = property[key]
        const normalized = this.normalizeImageValue(value)
        if (normalized) {
          return normalized
        }
      }

      const mediaCollections = [
        property.photos,
        property.images,
        property.media,
        property.gallery
      ]

      for (const collection of mediaCollections) {
        const resolved = this.extractFromCollection(collection)
        if (resolved) {
          return resolved
        }
      }

      return ''
    },
    extractFromCollection (collection) {
      if (!collection) {
        return ''
      }

      const items = Array.isArray(collection) ? collection : [collection]

      for (const item of items) {
        const normalized = this.normalizeImageValue(item)
        if (normalized) {
          return normalized
        }
      }

      return ''
    },
    normalizeImageValue (value) {
      if (!value) {
        return ''
      }

      if (typeof value === 'string') {
        return value.trim()
      }

      if (typeof value === 'object') {
        const candidateKeys = ['url', 'href', 'src']
        for (const key of candidateKeys) {
          if (value[key]) {
            return String(value[key]).trim()
          }
        }
      }

      return ''
    },
    normalizeWifiResponse (value) {
      if (!value) {
        return ''
      }

      if (typeof value === 'string') {
        return this.normalizeWifiString(value)
      }

      if (typeof value === 'object') {
        const candidateKeys = [
          'data_uri',
          'dataUri',
          'qr_code',
          'qrCode',
          'qr_image',
          'qrImage',
          'wifi_qr',
          'wifiQr',
          'url',
          'href',
          'src',
          'image',
          'image_url',
          'imageUrl',
          'data',
          'base64',
          'encoded'
        ]

        for (const key of candidateKeys) {
          if (value[key]) {
            const normalized = this.normalizeWifiString(String(value[key]))
            if (normalized) {
              return normalized
            }
          }
        }

        if (value.qr) {
          const normalizedQr = this.normalizeWifiString(String(value.qr))
          if (normalizedQr) {
            return normalizedQr
          }
        }
      }

      return ''
    },
    extractWifiFromProperty (payload) {
      if (!payload) {
        return ''
      }

      const property = payload.property || payload
      if (!property || typeof property !== 'object') {
        return ''
      }

      const directWifiKeys = [
        'wifi_qr_code',
        'wifiQrCode',
        'wifi_qr',
        'wifiQr',
        'wifi_qr_image',
        'wifiQrImage',
        'wifi_qr_url',
        'wifiQrUrl'
      ]

      for (const key of directWifiKeys) {
        if (property[key]) {
          const normalized = this.normalizeWifiString(String(property[key]))
          if (normalized) {
            return normalized
          }
        }
      }

      if (property.wifi && typeof property.wifi === 'object') {
        const wifiCandidates = [
          property.wifi.qr_code,
          property.wifi.qrCode,
          property.wifi.qr_image,
          property.wifi.qrImage,
          property.wifi.qr,
          property.wifi.code,
          property.wifi.image,
          property.wifi.image_url,
          property.wifi.imageUrl,
          property.wifi.url,
          property.wifi.href,
          property.wifi.src,
          property.wifi.data,
          property.wifi.base64,
          property.wifi.encoded
        ]

        for (const candidate of wifiCandidates) {
          const normalizedCandidate = this.normalizeWifiResponse(candidate)
          if (normalizedCandidate) {
            return normalizedCandidate
          }
        }
      }

      if (Array.isArray(property.assets)) {
        for (const asset of property.assets) {
          const assetCode = this.normalizeWifiResponse(asset)
          if (assetCode) {
            return assetCode
          }
        }
      }

      return ''
    },
    normalizeWifiString (value) {
      if (!value) {
        return ''
      }

      const trimmed = String(value).trim()
      if (!trimmed) {
        return ''
      }

      const decodedDataUri = this.decodeDataUriIfNeeded(trimmed)
      if (decodedDataUri) {
        return decodedDataUri
      }

      if (this.isLikelyHttpUrl(trimmed)) {
        return trimmed
      }

      return ''
    },
    decodeDataUriIfNeeded (value) {
      if (!value || typeof value !== 'string') {
        return ''
      }

      const trimmed = value.trim()
      if (!trimmed.toLowerCase().startsWith('data:')) {
        return ''
      }

      const commaIndex = trimmed.indexOf(',')
      if (commaIndex === -1) {
        return ''
      }

      const header = trimmed.slice(0, commaIndex)
      let data = trimmed.slice(commaIndex + 1)

      if (!data) {
        return ''
      }

      if (data.includes('%')) {
        try {
          data = decodeURIComponent(data)
        } catch (error) {
          console.warn('Failed to decode percent-encoded WiFi QR data URI', error)
          return ''
        }
      }

      data = data.replace(/\s+/g, '')

      if (/;base64/i.test(header)) {
        if (!this.isValidBase64(data)) {
          return ''
        }
      }

      return `${header},${data}`
    },
    isLikelyHttpUrl (value) {
      return /^https?:\/\//i.test(value)
    },
    isValidBase64 (value) {
      if (!value) {
        return false
      }

      const sanitized = value.replace(/\s+/g, '')
      if (!/^([A-Za-z0-9+/]+={0,2})$/.test(sanitized)) {
        return false
      }

      try {
        if (typeof window !== 'undefined' && typeof window.atob === 'function') {
          window.atob(sanitized)
        } else if (typeof Buffer !== 'undefined') {
          Buffer.from(sanitized, 'base64')
        }
        return true
      } catch (error) {
        console.warn('Invalid base64 WiFi QR payload', error)
        return false
      }
    }
  },
  watch: {
    credentialsDialog (value) {
      if (!value) {
        this.credentialsError = ''
        this.credentialsSaving = false
      }
    },
    adminDialog (value) {
      if (!value) {
        this.adminError = ''
        this.adminLoading = false
        this.resetAdminForm()
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
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #0f2034;
}

.display-main::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: var(--display-background-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.02);
  filter: brightness(0.82);
}

.display-main::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(145deg, rgba(6, 26, 57, 0.68), rgba(10, 43, 82, 0.55)),
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.22), transparent 55%),
    radial-gradient(circle at bottom right, rgba(100, 181, 246, 0.18), transparent 45%);
  mix-blend-mode: multiply;
}

.content-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.content-container::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.62) 35%, rgba(255, 255, 255, 0.45) 100%);
  backdrop-filter: blur(1.5px);
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
  z-index: 20;
}

@media (max-width: 960px) {
  .config-button {
    right: 16px;
    bottom: 16px;
  }
}
</style>

