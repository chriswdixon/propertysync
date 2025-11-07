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
      <v-container v-else-if="error" fluid class="fill-height">
        <v-row align="center" justify="center" class="fill-height">
          <v-col cols="12" class="text-center">
            <v-alert type="error">{{ error }}</v-alert>
          </v-col>
        </v-row>
      </v-container>
      <router-view v-else :guest-name="guestName" :property="property" :booking="booking"></router-view>
    </v-main>
  </v-app>
</template>

<script>
import api from './services/api'

export default {
  name: 'App',
  data () {
    return {
      loading: true,
      error: null,
      guestName: '',
      property: null,
      booking: null,
      propertyID: 1 // TODO: Get from config
    }
  },
  mounted () {
    this.loadData()
    // Set up WebSocket connection for real-time updates
    this.$ws.connect()
  },
  methods: {
    async loadData () {
      try {
        const data = await api.getPropertyData(this.propertyID)
        this.property = data.property
        this.booking = data.booking
        if (this.booking) {
          this.guestName = this.booking.guest_name
        }
        this.loading = false
      } catch (error) {
        this.error = error.message
        this.loading = false
      }
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
</style>

