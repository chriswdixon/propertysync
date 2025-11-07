<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="headline">
            Hi, {{ guestName || 'Guest' }}
          </v-card-title>
          <v-card-text>
            <div v-if="property">
              <h2>{{ property.name }}</h2>
              <p>{{ property.address }}</p>
            </div>
            <div v-if="booking" class="mt-4">
              <p><strong>Check-in:</strong> {{ formatDate(booking.check_in_date) }}</p>
              <p><strong>Check-out:</strong> {{ formatDate(booking.check_out_date) }}</p>
            </div>
          </v-card-text>
        </v-card>
        <v-card v-if="displayCheckoutPolicies.length > 0" class="mt-4">
          <v-card-title>Checkout Information</v-card-title>
          <v-card-text>
            <div v-for="(policy, index) in displayCheckoutPolicies" :key="index" class="mb-3">
              <h4>{{ policy.title }}</h4>
              <p>{{ policy.content }}</p>
            </div>
          </v-card-text>
        </v-card>
        <v-card v-if="displayPropertyRules.length > 0" class="mt-4">
          <v-card-title>Property Rules</v-card-title>
          <v-card-text>
            <div v-for="(rule, index) in displayPropertyRules" :key="index" class="mb-3">
              <h4>{{ rule.title }}</h4>
              <p>{{ rule.content }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>WiFi Access</v-card-title>
          <v-card-text class="text-center">
            <div v-if="wifiQRCode">
              <img :src="wifiQRCode" alt="WiFi QR Code" style="max-width: 200px;" />
              <p v-if="property && property.wifi_ssid">{{ property.wifi_ssid }}</p>
            </div>
            <div v-else class="offline-hint">
              <p>WiFi details are unavailable in offline mode. Please refer to your welcome packet.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-btn
          color="primary"
          large
          @click="$router.push('/troubleshooting')"
          class="mr-2"
        >
          <v-icon left>mdi-tools</v-icon>
          Troubleshooting
        </v-btn>
        <v-btn
          color="secondary"
          large
          :disabled="offline"
          @click="openHelpDialog"
          class="help-button"
        >
          <v-icon left>mdi-help-circle</v-icon>
          Report Problem
        </v-btn>
      </v-col>
    </v-row>
    <v-dialog v-model="showHelpDialog" max-width="600">
      <v-card>
        <v-card-title>Report a Problem</v-card-title>
        <v-card-text>
          <v-form ref="reportForm">
            <v-select
              v-model="reportData.report_type"
              :items="reportTypes"
              label="Problem Type"
              required
            ></v-select>
            <v-text-field
              v-model="reportData.title"
              label="Title"
              required
            ></v-text-field>
            <v-textarea
              v-model="reportData.description"
              label="Description"
              required
              rows="4"
            ></v-textarea>
            <v-select
              v-model="reportData.urgency"
              :items="urgencyLevels"
              label="Urgency"
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
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

const normalizeQr = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.qr_code || value.url || value.src || null
  }
  return null
}

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
.offline-hint {
  color: rgba(0, 0, 0, 0.54);
  font-size: 0.9rem;
}
</style>
