<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">Troubleshooting</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>WiFi Router</v-card-title>
          <v-card-text>
            <div v-if="routerStatus">
              <p><strong>Status:</strong> 
                <v-chip :color="routerStatus.online ? 'success' : 'error'" small>
                  {{ routerStatus.online ? 'Online' : 'Offline' }}
                </v-chip>
              </p>
              <p v-if="routerStatus.uptime"><strong>Uptime:</strong> {{ routerStatus.uptime }}</p>
              <p v-if="routerStatus.connected_devices">
                <strong>Connected Devices:</strong> {{ routerStatus.connected_devices }}
              </p>
              <p v-if="routerStatus.signal_strength">
                <strong>Signal Strength:</strong> {{ routerStatus.signal_strength }}
              </p>
              <p v-if="offline" class="offline-note mt-2">
                Live router data is unavailable while the display is offline.
              </p>
            </div>
            <div v-else class="text-center">
              <v-progress-circular v-if="canCallApi" indeterminate></v-progress-circular>
              <p v-else class="offline-note">Router status is unavailable while the display is offline.</p>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="refreshRouterStatus" :disabled="!canCallApi">
              <v-icon left>mdi-refresh</v-icon>
              Refresh Status
            </v-btn>
            <v-btn
              color="warning"
              @click="confirmReboot"
              :disabled="!routerStatus || !routerStatus.online || !canCallApi"
            >
              <v-icon left>mdi-power</v-icon>
              Reboot Router
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Quick Fixes</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>WiFi Not Working?</v-list-item-title>
                  <v-list-item-subtitle>
                    Try rebooting the router or check if other devices can connect
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Slow Internet?</v-list-item-title>
                  <v-list-item-subtitle>
                    Check the number of connected devices and try rebooting the router
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Can't Connect?</v-list-item-title>
                  <v-list-item-subtitle>
                    Make sure you're using the correct WiFi password shown on this screen
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Common Issues</v-card-title>
          <v-card-text>
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-header>WiFi Connection Issues</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <ol>
                    <li>Check that WiFi is enabled on your device</li>
                    <li>Verify you're connected to the correct network ({{ property && property.wifi_ssid ? property.wifi_ssid : 'Network Name' }})</li>
                    <li>Try forgetting the network and reconnecting</li>
                    <li>Restart your device</li>
                    <li>If the problem persists, try rebooting the router</li>
                  </ol>
                </v-expansion-panel-content>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-header>Slow Internet Speed</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <ol>
                    <li>Check how many devices are connected to the network</li>
                    <li>Move closer to the router</li>
                    <li>Close bandwidth-heavy applications</li>
                    <li>Try rebooting the router</li>
                    <li>Contact the property owner if issues continue</li>
                  </ol>
                </v-expansion-panel-content>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-header>TV/Streaming Issues</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <ol>
                    <li>Check that the TV is powered on</li>
                    <li>Verify HDMI/input connections</li>
                    <li>Try unplugging and replugging the TV</li>
                    <li>Check if streaming apps need to be signed in</li>
                  </ol>
                </v-expansion-panel-content>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-header>Thermostat Issues</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <ol>
                    <li>Check the thermostat display is on</li>
                    <li>Verify the temperature setting</li>
                    <li>Try adjusting the temperature up or down</li>
                    <li>Wait 10-15 minutes for changes to take effect</li>
                  </ol>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-btn color="primary" large @click="$router.push('/')">
          <v-icon left>mdi-home</v-icon>
          Back to Home
        </v-btn>
        <v-btn
          color="secondary"
          large
          @click="$emit('show-help')"
          class="ml-2"
        >
          <v-icon left>mdi-help-circle</v-icon>
          Still Need Help?
        </v-btn>
      </v-col>
    </v-row>
    <v-dialog v-model="showRebootDialog" max-width="400">
      <v-card>
        <v-card-title>Reboot Router?</v-card-title>
        <v-card-text>
          <p>Are you sure you want to reboot the router? This will temporarily disconnect all devices from WiFi.</p>
          <p class="mt-2"><strong>This will take about 2-3 minutes.</strong></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showRebootDialog = false">Cancel</v-btn>
          <v-btn color="warning" @click="rebootRouter" :disabled="!canCallApi">Yes, Reboot</v-btn>
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
    offline: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      routerStatus: this.offline ? offlineRouterStatus() : null,
      showRebootDialog: false,
      showHelpDialog: false
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
    }
  },
  computed: {
    canCallApi () {
      return !this.offline && API_CONFIGURED && this.property && this.property.id
    }
  },
  methods: {
    async loadRouterStatus () {
      if (!this.canCallApi) return
      
      try {
        const response = await api.getRouterStatus(this.property.id)
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
        await api.logTroubleshootingAccess(this.property.id, {
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
        await api.rebootRouter(this.property.id, params)
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
    }
  }
}
</script>

<style scoped>
h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
}
.offline-note {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
}
</style>

