import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  getPropertyData (propertyID) {
    return api.get(`/pi/property/${propertyID}`).then(res => res.data)
  },
  getWiFiQR (propertyID) {
    return api.get(`/pi/property/${propertyID}/wifi-qr`).then(res => res.data)
  },
  getActiveBooking (propertyID) {
    return api.get(`/pi/active-booking/${propertyID}`).then(res => res.data)
  },
  submitGuestReport (reportData) {
    return api.post('/guest-reports', reportData).then(res => res.data)
  },
  getRouterStatus (propertyID) {
    return api.get(`/pi/property/${propertyID}/router/status`).then(res => res.data)
  },
  rebootRouter (propertyID, params) {
    return api.post(`/pi/property/${propertyID}/router/reboot`, null, { params }).then(res => res.data)
  },
  logTroubleshootingAccess (propertyID, data) {
    return api.post(`/pi/property/${propertyID}/troubleshooting/log`, data).then(res => res.data)
  }
}

