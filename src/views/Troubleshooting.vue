<template>
  <v-container fluid class="troubleshooting-display pa-6 pa-md-12">
    <v-row class="mb-8" align="center">
      <v-col cols="12" md="8">
        <h1 class="page-title">
          <v-icon color="primary" left>mdi-lifebuoy</v-icon>
          We're here to help
        </h1>
        <p class="page-subtitle">Guided steps to keep your stay running smoothly.</p>
      </v-col>
      <v-col cols="12" md="4" class="d-flex justify-md-end justify-center">
        <v-btn color="primary" class="mr-2" large @click="$router.push('/')">
          <v-icon left>mdi-home</v-icon>
          Back to Welcome Screen
        </v-btn>
        <v-btn
          color="secondary"
          outlined
          large
          :disabled="!canSubmitReport"
          @click="openHelpDialog"
        >
          <v-icon left>mdi-headset</v-icon>
          Contact Host
        </v-btn>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" md="5">
        <v-card class="status-card" elevation="12">
          <v-card-text class="pa-8">
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <h2 class="status-title">Network Status</h2>
                <p class="status-subtitle">Live health of the property router.</p>
              </div>
              <v-avatar size="52" :color="statusColor + ' lighten-4'">
                <v-icon :color="statusColor">{{ statusIcon }}</v-icon>
              </v-avatar>
            </div>

            <div v-if="routerStatus" class="status-metrics mb-4">
              <div class="status-pill" :class="statusPillClass">
                <v-icon left small>{{ statusIcon }}</v-icon>
                {{ statusMessage }}
              </div>
              <div class="metric">
                <span class="metric-label">Uptime</span>
                <span class="metric-value">{{ routerStatus.uptime || '—' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Connected devices</span>
                <span class="metric-value">{{ routerStatus.connected_devices ?? '—' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Signal strength</span>
                <span class="metric-value">{{ routerStatus.signal_strength || '—' }}</span>
              </div>
              <p v-if="offline" class="offline-note mt-3">
                Live router data is paused while offline. We’ll refresh when the connection returns.
              </p>
            </div>
            <div v-else class="text-center py-6">
              <v-progress-circular v-if="canCallApi" size="48" indeterminate color="primary"></v-progress-circular>
              <p v-else class="offline-note mt-3">Router status is unavailable while the display is offline.</p>
            </div>

            <div class="d-flex flex-column flex-sm-row">
              <v-btn
                color="primary"
                class="mb-3 mr-sm-4"
                large
                :disabled="!canCallApi"
                @click="refreshRouterStatus"
              >
                <v-icon left>mdi-reload</v-icon>
                Refresh Status
              </v-btn>
              <v-btn
                color="warning"
                large
                :disabled="!routerStatus || !routerStatus.online || !canCallApi"
                @click="confirmReboot"
              >
                <v-icon left>mdi-restore</v-icon>
                Reboot Router
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-8 assistance-card" elevation="8">
          <v-card-text class="pa-6">
            <h3 class="assistant-title">Need a quicker answer?</h3>
            <p class="assistant-subtitle">
              Scan the Wi-Fi QR code below or tap contact host to chat with us directly.
            </p>
            <v-btn color="primary" text :disabled="!canSubmitReport" @click="openHelpDialog">
              <v-icon left>mdi-message-text</v-icon>
              Message the host
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="mt-8 wifi-card" elevation="12">
          <v-card-text class="py-8 px-6 text-center">
            <div class="wifi-chip mb-4">
              <v-chip color="white" class="primary--text" outlined>
                <v-icon left color="primary">mdi-wifi</v-icon>
                Wi-Fi Access
              </v-chip>
            </div>
            <div v-if="wifiQRCode" class="wifi-qr-wrapper">
              <img :src="wifiQRCode" alt="WiFi QR Code" class="wifi-qr elevation-8" />
              <p v-if="wifiSsid" class="wifi-ssid">
                {{ wifiSsid }}
              </p>
            </div>
            <div v-else class="offline-hint">
              <v-icon large color="white" class="mb-3">mdi-cloud-off-outline</v-icon>
              <p>Wi-Fi details are unavailable right now. Please check the welcome packet.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card class="quick-fixes" elevation="10">
          <v-card-title>
            <v-icon left color="primary">mdi-lightbulb-on-outline</v-icon>
            Quick Fixes
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" sm="6" v-for="(tip, index) in quickFixes" :key="index">
                <v-sheet class="tip-card" elevation="2">
                  <div class="tip-icon">
                    <v-icon color="primary">{{ tip.icon }}</v-icon>
                  </div>
                  <div>
                    <h4 class="tip-title">{{ tip.title }}</h4>
                    <p class="tip-body">{{ tip.body }}</p>
                  </div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mt-8" elevation="10">
          <v-card-title>
            <v-icon left color="primary">mdi-book-open-variant</v-icon>
            Common Issues &amp; Resolutions
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-0">
            <v-expansion-panels accordion tile>
              <v-expansion-panel v-for="(issue, index) in issueGuides" :key="index">
                <v-expansion-panel-header class="issue-header">
                  <v-icon left color="primary">{{ issue.icon }}</v-icon>
                  {{ issue.title }}
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <ol class="guide-list">
                    <li v-for="(step, idx) in issue.steps" :key="idx">{{ step }}</li>
                  </ol>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showRebootDialog" max-width="420">
      <v-card>
        <v-card-title class="headline font-weight-bold">
          <v-icon left color="warning">mdi-alert-decagram</v-icon>
          Reboot router?
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <p>
            This will temporarily disconnect all devices from Wi-Fi. Please confirm everyone is ready before
            continuing.
          </p>
          <p class="font-weight-medium mt-4">The reboot takes about 2-3 minutes.</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn text @click="showRebootDialog = false">Cancel</v-btn>
          <v-btn color="warning" :disabled="!canCallApi" @click="rebootRouter">Yes, reboot</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
            :disabled="reportSubmitting || !canSubmitReport"
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
const offlineRouterStatus = () => ({
  online: false,
  uptime: 'Unavailable',
  connected_devices: 0,
  signal_strength: 'Unavailable'
})

const candidateQrKeys = [
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
    for (const key of candidateQrKeys) {
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

  const decoded = decodeDataUriIfNeeded(trimmed)
  if (decoded) {
    return decoded
  }

  if (/^https?:\/\//i.test(trimmed)) {
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

export default {
  name: 'Troubleshooting',
  props: {
    property: {
      type: Object,
      default: () => null
    },
    guestName: {
      type: String,
      default: ''
    },
    booking: {
      type: Object,
      default: () => null
    },
    wifiQr: {
      type: [String, Object],
      default: null
    },
    offline: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      routerStatus: this.offline ? offlineRouterStatus() : null,
      showRebootDialog: false,
      showHelpDialog: false,
      reportSubmitting: false,
      localWiFiQr: normalizeQr(this.wifiQr),
      quickFixes: [
        {
          title: 'Restart your device',
          body: 'Turning your phone, tablet, or laptop off and back on solves most connection glitches.',
          icon: 'mdi-restart'
        },
        {
          title: 'Move closer',
          body: 'Walls and appliances can weaken Wi-Fi. Step closer to the router for a stronger signal.',
          icon: 'mdi-access-point-network'
        },
        {
          title: 'Forget & reconnect',
          body: 'Remove the network from your device’s Wi-Fi list, then scan the QR code to reconnect.',
          icon: 'mdi-wifi-arrow-up-down'
        },
        {
          title: 'Pause heavy streaming',
          body: 'If several devices are streaming at once, pause a few to improve speed for everyone.',
          icon: 'mdi-play-pause'
        }
      ],
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
  mounted () {
    if (this.canCallApi) {
      this.loadRouterStatus()
      this.logTroubleshootingAccess()
    }
  },
  watch: {
    offline (value) {
      if (value) {
        this.routerStatus = offlineRouterStatus()
        this.showHelpDialog = false
      } else if (this.canCallApi) {
        this.routerStatus = null
        this.loadRouterStatus()
        this.logTroubleshootingAccess()
      }
    },
    property (value) {
      if (value && value.id && this.canCallApi) {
        this.loadRouterStatus()
        this.logTroubleshootingAccess()
      }
    },
    wifiQr: {
      immediate: true,
      handler (value) {
        this.localWiFiQr = normalizeQr(value)
      }
    },
    showHelpDialog (value) {
      if (!value) {
        this.reportSubmitting = false
        this.resetReport()
      }
    }
  },
  computed: {
    canCallApi () {
      return !this.offline && API_CONFIGURED && api.hasDisplayCredentials() && this.property && this.property.id
    },
    statusColor () {
      if (!this.routerStatus) {
        return 'info'
      }
      return this.routerStatus.online ? 'success' : 'error'
    },
    statusMessage () {
      if (!this.routerStatus) {
        return 'Checking connection'
      }
      return this.routerStatus.online ? 'Network looks great' : 'We’re offline'
    },
    statusIcon () {
      if (!this.routerStatus) {
        return 'mdi-wifi-refresh'
      }
      return this.routerStatus.online ? 'mdi-wifi-check' : 'mdi-wifi-off'
    },
    statusPillClass () {
      return this.routerStatus && this.routerStatus.online ? 'pill-online' : 'pill-offline'
    },
    wifiQRCode () {
      return this.localWiFiQr
    },
    wifiSsid () {
      if (this.property && this.property.wifi_ssid) {
        return this.property.wifi_ssid
      }
      return ''
    },
    canSubmitReport () {
      return this.canCallApi
    },
    issueGuides () {
      const wifiName = this.property && this.property.wifi_ssid ? this.property.wifi_ssid : 'the property network'
      return [
        {
          title: 'Wi-Fi connection issues',
          icon: 'mdi-wifi-alert',
          steps: [
            'Ensure Wi-Fi is enabled on your device.',
            `Connect to "${wifiName}".`,
            'Forget the network and reconnect if prompted for the password again.',
            'Restart your device.',
            'Reboot the router if nothing changes.'
          ]
        },
        {
          title: 'Slow internet speed',
          icon: 'mdi-speedometer-slow',
          steps: [
            'Check how many devices are streaming or downloading large files.',
            'Move closer to the router to reduce interference.',
            'Pause or close heavy streaming apps.',
            'Reboot the router to refresh the connection.',
            'Contact the host if speeds do not recover.'
          ]
        },
        {
          title: 'TV / streaming issues',
          icon: 'mdi-television',
          steps: [
            'Confirm the TV is powered on and the correct HDMI/input is selected.',
            'Check streaming app logins—some services sign out automatically.',
            'Unplug the TV for 30 seconds, then plug it back in.',
            'Ensure the streaming device has power and is connected to Wi-Fi.'
          ]
        },
        {
          title: 'Thermostat not responding',
          icon: 'mdi-thermometer-lines',
          steps: [
            'Confirm the thermostat display is lit.',
            'Adjust the temperature up or down by a few degrees.',
            'Give the system 10–15 minutes to react.',
            'If no change, contact the host for assistance.'
          ]
        }
      ]
    }
  },
  methods: {
    async loadRouterStatus () {
      if (!this.canCallApi) return

      try {
        const response = await api.getRouterStatus()
        this.routerStatus = response
      } catch (error) {
        console.error('Failed to load router status:', error)
        this.routerStatus = offlineRouterStatus()
      }
    },
    async refreshRouterStatus () {
      if (!this.canCallApi) {
        alert('Live router status is unavailable while the display is offline.')
        return
      }
      await this.loadRouterStatus()
    },
    openHelpDialog () {
      if (!this.canSubmitReport) {
        alert('The display is currently offline. Please contact your host directly for assistance.')
        return
      }
      this.showHelpDialog = true
    },
    confirmReboot () {
      if (!this.canCallApi) {
        alert('The display is offline, so the router cannot be rebooted remotely right now.')
        return
      }
      this.showRebootDialog = true
    },
    async logTroubleshootingAccess () {
      if (!this.canCallApi) return

      try {
        await api.logTroubleshootingAccess({
          guest_name: this.guestName || 'Guest',
          action: 'view_troubleshooting'
        })
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Failed to log troubleshooting access:', error)
      }
    },
    async rebootRouter () {
      if (!this.canCallApi) {
        alert('Unable to reboot router while offline. Please try again once connectivity is restored.')
        this.showRebootDialog = false
        return
      }
      try {
        const params = {}
        if (this.guestName) {
          params.guest_name = this.guestName
        }
        await api.rebootRouter(params)
        this.showRebootDialog = false
        alert('Router reboot initiated. Please wait 2-3 minutes for the router to restart.')
        // Refresh status after a delay
        setTimeout(() => {
          this.loadRouterStatus()
        }, 180000) // 3 minutes
      } catch (error) {
        console.error('Failed to reboot router:', error)
        alert('Failed to reboot router. Please try again or contact support.')
      }
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
          property_id: this.property ? this.property.id : null,
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
        this.resetReport()
      } catch (error) {
        console.error('Failed to submit report:', error)
        alert('Failed to submit report. Please try again.')
      } finally {
        this.reportSubmitting = false
      }
    },
    resetReport () {
      this.reportData = {
        report_type: 'maintenance',
        title: '',
        description: '',
        urgency: 'normal'
      }
    }
  }
}
</script>

<style scoped>
.troubleshooting-display {
  position: relative;
}

.page-title {
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgba(0, 0, 0, 0.54);
  margin: 0;
}

.status-card {
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(25, 118, 210, 0.85), rgba(33, 150, 243, 0.75));
  color: white;
}

.status-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
}

.status-subtitle {
  margin: 4px 0 0;
  opacity: 0.9;
}

.status-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-pill {
  border-radius: 999px;
  padding: 8px 18px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  backdrop-filter: blur(3px);
}

.pill-online {
  background: rgba(76, 175, 80, 0.25);
  color: #e8f5e9;
}

.pill-offline {
  background: rgba(244, 67, 54, 0.25);
  color: #ffebee;
}

.metric {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.metric-label {
  opacity: 0.9;
}

.metric-value {
  font-weight: 600;
}

.offline-note {
  opacity: 0.85;
}

.assistance-card {
  border-radius: 18px;
  background: white;
}

.assistant-title {
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.assistant-subtitle {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.6);
}

.wifi-card {
  border-radius: 18px;
  background: linear-gradient(145deg, #1976d2, #2196f3);
  color: white;
}

.wifi-chip {
  display: flex;
  justify-content: center;
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

.issue-header {
  align-items: center !important;
  gap: 16px;
}

.quick-fixes {
  border-radius: 18px;
}

.tip-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-radius: 16px;
  padding: 18px 20px;
  background: rgba(244, 247, 251, 0.85);
}

.tip-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(25, 118, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip-title {
  margin: 0 0 6px;
  font-weight: 600;
}

.tip-body {
  margin: 0;
  color: rgba(0, 0, 0, 0.62);
}

.guide-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(0, 0, 0, 0.74);
}

.guide-list li {
  margin-bottom: 6px;
}

@media (max-width: 960px) {
  .page-title {
    font-size: 2rem;
  }

  .status-card {
    margin-bottom: 16px;
  }

  .tip-card {
    flex-direction: column;
  }
}
</style>
</style>

