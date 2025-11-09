<template>
  <v-container fluid class="welcome-display pa-6 pa-md-12">
    <transition name="fade">
      <v-alert
        v-if="offline"
        type="warning"
        class="mb-6"
        border="left"
        colored-border
        elevation="3"
      >
        We’re in offline mode. Some live updates may be unavailable, but you can still find the essentials here.
      </v-alert>
    </transition>

    <v-row class="hero-row" dense>
      <v-col cols="12" md="8">
        <v-card class="hero-card" :style="heroBackgroundStyle" elevation="12">
          <v-card-text class="pa-8">
            <div class="hero-greeting">
              <v-icon left large class="mr-2">mdi-emoticon-happy-outline</v-icon>
              <span>{{ greetingMessageWithName }}</span>
            </div>
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">{{ propertyName }}</h1>
                <p class="hero-subtitle">{{ propertyAddress }}</p>
              </div>
              <v-avatar size="72" class="hero-avatar elevation-6" color="primary lighten-2">
                <span>{{ guestInitials }}</span>
              </v-avatar>
            </div>
            <div class="hero-tiles mt-6">
              <v-sheet class="hero-tile" elevation="4">
                <div class="tile-icon primary--text"><v-icon>mdi-calendar-arrow-right</v-icon></div>
                <div class="tile-heading">Check-in</div>
                <div class="tile-detail">{{ formattedCheckIn }}</div>
              </v-sheet>
              <v-sheet class="hero-tile" elevation="4">
                <div class="tile-icon primary--text"><v-icon>mdi-calendar-arrow-left</v-icon></div>
                <div class="tile-heading">Check-out</div>
                <div class="tile-detail">{{ formattedCheckOut }}</div>
              </v-sheet>
              <v-sheet class="hero-tile" elevation="4">
                <div class="tile-icon primary--text"><v-icon>mdi-account-heart</v-icon></div>
                <div class="tile-heading">Guest</div>
                <div class="tile-detail">{{ guestName || 'Guest' }}</div>
              </v-sheet>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-if="displayCheckoutPolicies.length > 0" class="mt-8 section-card" elevation="10">
          <v-card-title class="section-title">
            <v-icon color="primary" left>mdi-clipboard-check-outline</v-icon>
            Checkout Highlights
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="py-6 px-6">
            <v-timeline dense class="transparent-timeline">
              <v-timeline-item
                v-for="(policy, index) in displayCheckoutPolicies"
                :key="index"
                small
                color="primary"
              >
                <strong>{{ policy.title }}</strong>
                <div class="text-body-2 mt-1">{{ policy.content }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <v-card v-if="displayPropertyRules.length > 0" class="mt-8 section-card" elevation="10">
          <v-card-title class="section-title">
            <v-icon color="primary" left>mdi-home-heart</v-icon>
            House Guidelines
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="py-5 px-6">
            <v-list two-line class="rules-list">
              <v-list-item
                v-for="(rule, index) in displayPropertyRules"
                :key="index"
                class="rules-item"
              >
                <v-list-item-avatar color="primary" class="rule-avatar">
                  <span>{{ index + 1 }}</span>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium">{{ rule.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ rule.content }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="wifi-card" elevation="12">
          <v-card-text class="py-8 px-6 text-center">
            <div class="wifi-heading mb-4">
              <v-icon left color="white">mdi-wifi</v-icon>
              <span>Wi-Fi Access</span>
            </div>
            <div v-if="wifiQRCode" class="wifi-qr-wrapper">
              <img :src="wifiQRCode" alt="WiFi QR Code" class="wifi-qr elevation-8" />
              <p v-if="property && property.wifi_ssid" class="wifi-ssid">
                {{ property.wifi_ssid }}
              </p>
            </div>
            <div v-else class="offline-hint">
              <v-icon large color="white" class="mb-3">mdi-cloud-off-outline</v-icon>
              <p>WiFi details are unavailable in offline mode. Please refer to your welcome packet.</p>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-8 action-card" elevation="8">
          <v-card-text>
            <p class="action-heading">Need a hand?</p>
            <p class="action-subheading">
              We’re here if something isn’t quite right. Choose a quick action below.
            </p>
            <div class="d-flex flex-column">
              <v-btn
                color="primary"
                class="mb-3"
                large
                @click="$router.push('/troubleshooting')"
              >
                <v-icon left>mdi-tools</v-icon>
                Troubleshooting Guide
              </v-btn>
              <v-btn
                color="secondary"
                outlined
                large
                :disabled="offline"
                @click="openHelpDialog"
              >
                <v-icon left>mdi-lifebuoy</v-icon>
                Report a Problem
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-8 map-card" elevation="10">
          <v-card-title class="section-title">
            <v-icon left color="primary">mdi-map-search</v-icon>
            Nearby Restaurants
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-0">
            <div class="map-frame-wrapper">
              <iframe
                :src="restaurantMapUrl"
                class="map-frame"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showHelpDialog" max-width="540">
      <v-card>
        <v-card-title class="headline font-weight-bold">
          <v-icon left color="primary">mdi-lifebuoy</v-icon>
          Let us know what’s happening
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-form ref="reportForm">
            <v-select
              v-model="reportData.report_type"
              :items="reportTypes"
              label="Need help with"
              outlined
              dense
              required
            ></v-select>
            <v-text-field
              v-model="reportData.title"
              label="Short title"
              outlined
              dense
              required
            ></v-text-field>
            <v-textarea
              v-model="reportData.description"
              label="Tell us more"
              outlined
              auto-grow
              rows="3"
              required
            ></v-textarea>
            <v-select
              v-model="reportData.urgency"
              :items="urgencyLevels"
              label="Urgency"
              outlined
              dense
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn text @click="showHelpDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="reportSubmitting || offline"
            :loading="reportSubmitting"
            @click="submitReport"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import api from '../services/api'

const API_CONFIGURED = Boolean(process.env.VUE_APP_API_URL)

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
  'encoded',
  'qr'
]

const normalizeQr = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    return normalizeQrString(value)
  }

  if (typeof value === 'object') {
    for (const key of candidateKeys) {
      if (value[key]) {
        const normalized = normalizeQrString(String(value[key]))
        if (normalized) {
          return normalized
        }
      }
    }
  }

  return null
}

const normalizeQrString = (value) => {
  if (!value) return ''

  const trimmed = String(value).trim()
  if (!trimmed) return ''

  const decodedDataUri = decodeDataUriIfNeeded(trimmed)
  if (decodedDataUri) {
    return decodedDataUri
  }

  if (isLikelyHttpUrl(trimmed)) {
    return trimmed
  }

  return ''
}

const decodeDataUriIfNeeded = (value) => {
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
      console.warn('Failed to decode percent-encoded QR data URI', error)
      return ''
    }
  }

  data = data.replace(/\s+/g, '')

  if (/;base64/i.test(header) && !isValidBase64(data)) {
    return ''
  }

  return `${header},${data}`
}

const isLikelyHttpUrl = (value) => /^https?:\/\//i.test(value)

const isValidBase64 = (value) => {
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
    console.warn('Invalid base64 QR payload', error)
    return false
  }
}

const gradientPalette = [
  'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #005c97 0%, #363795 100%)',
  'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)'
]

export default {
  name: 'WelcomeDisplay',
  props: {
    guestName: {
      type: String,
      default: ''
    },
    property: {
      type: Object,
      default: () => null
    },
    booking: {
      type: Object,
      default: () => null
    },
    wifiQr: {
      type: [String, Object],
      default: null
    },
    checkoutPolicies: {
      type: Array,
      default: () => []
    },
    propertyRules: {
      type: Array,
      default: () => []
    },
    offline: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      showHelpDialog: false,
      reportSubmitting: false,
      localWiFiQr: normalizeQr(this.wifiQr),
      localCheckoutPolicies: Array.isArray(this.checkoutPolicies) ? this.checkoutPolicies : [],
      localPropertyRules: Array.isArray(this.propertyRules) ? this.propertyRules : [],
      heroBackgroundValue: gradientPalette[Math.floor(Math.random() * gradientPalette.length)],
      reportData: {
        report_type: 'maintenance',
        title: '',
        description: '',
        urgency: 'normal'
      },
      reportTypes: [
        { text: 'Maintenance Issue', value: 'maintenance' },
        { text: 'Appliance Problem', value: 'appliance' },
        { text: 'WiFi/Internet Issue', value: 'wifi' },
        { text: 'Safety Concern', value: 'safety' },
        { text: 'Other', value: 'other' }
      ],
      urgencyLevels: [
        { text: 'Low', value: 'low' },
        { text: 'Normal', value: 'normal' },
        { text: 'High', value: 'high' },
        { text: 'Urgent', value: 'urgent' }
      ]
    }
  },
  watch: {
    wifiQr: {
      immediate: true,
      handler (value) {
        this.localWiFiQr = normalizeQr(value)
      }
    },
    checkoutPolicies: {
      immediate: true,
      handler (value) {
        this.localCheckoutPolicies = Array.isArray(value) ? value : []
      }
    },
    propertyRules: {
      immediate: true,
      handler (value) {
        this.localPropertyRules = Array.isArray(value) ? value : []
      }
    },
    property: {
      immediate: true,
      handler (value) {
        if (value && value.id) {
          this.hydrateFromApi()
        }
      }
    },
    offline (isOffline) {
      if (!isOffline) {
        this.hydrateFromApi()
      }
    }
  },
  computed: {
    displayCheckoutPolicies () {
      return this.localCheckoutPolicies
    },
    displayPropertyRules () {
      return this.localPropertyRules
    },
    wifiQRCode () {
      return this.localWiFiQr
    },
    canSubmitReport () {
      return !this.offline && API_CONFIGURED && api.hasDisplayCredentials() && this.property && this.property.id
    },
    propertyName () {
      return this.property && this.property.name ? this.property.name : 'PropertySync Residence'
    },
    propertyAddress () {
      if (this.property && this.property.address) {
        return this.property.address
      }
      return 'Your home away from home'
    },
    guestInitials () {
      if (!this.guestName) {
        return 'G'
      }
      const parts = this.guestName.trim().split(/\s+/)
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase()
      }
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    },
    greetingMessage () {
      const hour = new Date().getHours()
      if (hour < 12) return 'Good morning'
      if (hour < 18) return 'Good afternoon'
      return 'Good evening'
    },
    greetingMessageWithName () {
      const base = this.greetingMessage
      const name = (this.guestName && this.guestName.trim()) ? this.guestName.trim() : 'Guest'
      return `${base} ${name}`
    },
    formattedCheckIn () {
      if (this.booking && this.booking.check_in_date) {
        return this.formatDate(this.booking.check_in_date)
      }
      return 'We’ll confirm soon'
    },
    formattedCheckOut () {
      if (this.booking && this.booking.check_out_date) {
        return this.formatDate(this.booking.check_out_date)
      }
      return 'We’ll confirm soon'
    },
    heroBackgroundStyle () {
      return {
        background: this.heroBackgroundValue
      }
    },
    restaurantMapUrl () {
      const baseQuery = this.propertyAddress
        ? `restaurants near ${this.propertyAddress}`
        : this.propertyName
          ? `restaurants near ${this.propertyName}`
          : 'restaurants'
      const query = encodeURIComponent(baseQuery)
      return `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`
    }
  },
  methods: {
    async hydrateFromApi () {
      if (this.offline || !API_CONFIGURED || !api.hasDisplayCredentials() || !this.property || !this.property.id) {
        return
      }

      const needsPolicies = !this.localCheckoutPolicies.length
      const needsRules = !this.localPropertyRules.length
      const needsWifi = !this.localWiFiQr

      if (!needsPolicies && !needsRules && !needsWifi) {
        return
      }

      if (needsPolicies || needsRules) {
        try {
          const response = await api.getPropertyData()
          if (needsPolicies && response.checkout_policies) {
            this.localCheckoutPolicies = response.checkout_policies
          }
          if (needsRules && response.property_rules) {
            this.localPropertyRules = response.property_rules
          }
        } catch (error) {
          console.error('Failed to load property data:', error)
        }
      }

      if (needsWifi) {
        try {
          const response = await api.getWiFiQR()
          this.localWiFiQr = normalizeQr(response)
        } catch (error) {
          console.error('Failed to load WiFi QR code:', error)
        }
      }
    },
    openHelpDialog () {
      if (this.offline || !API_CONFIGURED || !api.hasDisplayCredentials()) {
        alert('The display is currently offline. Please contact your host directly for assistance.')
        return
      }
      this.showHelpDialog = true
    },
    async submitReport () {
      if (!this.canSubmitReport) {
        alert('The display is currently offline. Please contact your host directly for assistance.')
        return
      }
      if (!this.reportData.title || !this.reportData.description) {
        alert('Please fill in all required fields')
        return
      }
      if (!this.reportData.report_type) {
        alert('Please select a problem type')
        return
      }

      this.reportSubmitting = true
      try {
        const reportPayload = {
          property_id: this.property.id,
          booking_id: this.booking ? this.booking.id : null,
          guest_name: this.guestName || 'Guest',
          guest_email: this.booking ? this.booking.guest_email : '',
          report_type: this.reportData.report_type,
          title: this.reportData.title,
          description: this.reportData.description,
          urgency: this.reportData.urgency
        }

        await api.submitGuestReport(reportPayload)
        alert('Thank you! Your report has been submitted. We will contact you shortly.')
        this.showHelpDialog = false
        this.reportData = {
          report_type: 'maintenance',
          title: '',
          description: '',
          urgency: 'normal'
        }
      } catch (error) {
        console.error('Failed to submit report:', error)
        alert('Failed to submit report. Please try again.')
      } finally {
        this.reportSubmitting = false
      }
    },
    formatDate (date) {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.welcome-display {
  position: relative;
}

.hero-row {
  margin-top: 8px;
}

.hero-card {
  border-radius: 16px;
  color: white;
  overflow: hidden;
  position: relative;
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.85), rgba(25, 118, 210, 0.55));
  mix-blend-mode: overlay;
}

.hero-card .v-card__text {
  position: relative;
  z-index: 1;
}

.hero-greeting {
  display: flex;
  align-items: center;
  font-size: 1.6rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.hero-greeting span {
  word-break: break-word;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 24px;
  gap: 16px;
}

.hero-text {
  flex: 1 1 60%;
  min-width: 0;
}

.hero-title {
  font-size: 2.4rem;
  font-weight: 700;
  margin: 0;
  word-break: break-word;
  line-height: 1.1;
}

.hero-subtitle {
  opacity: 0.85;
  font-size: 1.05rem;
  margin-bottom: 0;
  word-break: break-word;
}

.hero-avatar {
  font-size: 1.5rem;
  color: white;
  font-weight: 600;
}

.hero-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.hero-tile {
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 18px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero-tile .tile-icon {
  font-size: 1.6rem;
}

.hero-tile .tile-heading {
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #546e7a;
}

.hero-tile .tile-detail {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1a237e;
}

.section-card {
  border-radius: 16px;
}

.section-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.transparent-timeline::before {
  background-color: rgba(25, 118, 210, 0.2);
}

.rules-list {
  background: transparent;
}

.rules-item {
  border-radius: 12px;
  margin-bottom: 12px;
  backdrop-filter: blur(4px);
}

.rules-item:last-of-type {
  margin-bottom: 0;
}

.rule-avatar {
  color: white;
  font-weight: 600;
}

.wifi-card {
  border-radius: 18px;
  background: linear-gradient(145deg, #1976d2, #2196f3);
  color: white;
}

.wifi-heading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
}

.wifi-qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wifi-qr {
  max-width: 220px;
  border-radius: 18px;
  padding: 12px;
  background: white;
}

.wifi-ssid {
  margin-top: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.offline-hint {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.action-card {
  border-radius: 18px;
}

.action-heading {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.action-subheading {
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.map-card {
  border-radius: 18px;
  overflow: hidden;
}

.map-frame-wrapper {
  position: relative;
  padding-top: 56.25%;
  background: rgba(0, 0, 0, 0.12);
}

.map-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0 0 18px 18px;
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-content {
    align-items: flex-start;
  }

  .hero-text {
    flex-basis: 100%;
  }

  .hero-avatar {
    margin-top: 16px;
  }
}
</style>
</style>
