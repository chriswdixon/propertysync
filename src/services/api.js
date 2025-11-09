import axios from 'axios'

const baseURL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api'

const defaultHeaders = {
  'Content-Type': 'application/json'
}

const authedApi = axios.create({
  baseURL,
  headers: { ...defaultHeaders }
})

const publicApi = axios.create({
  baseURL,
  headers: { ...defaultHeaders }
})

let displayToken = process.env.VUE_APP_DISPLAY_TOKEN || ''
let displaySecret = process.env.VUE_APP_DISPLAY_SECRET || ''

const setDisplayCredentials = (token, secret) => {
  displayToken = token || ''
  displaySecret = secret || ''

  if (displayToken && displaySecret) {
    authedApi.defaults.headers.common.Authorization = `Bearer ${displayToken}`
    authedApi.defaults.headers.common['X-Display-Token'] = displayToken
    authedApi.defaults.headers.common['X-Display-Secret'] = displaySecret
  } else {
    delete authedApi.defaults.headers.common.Authorization
    delete authedApi.defaults.headers.common['X-Display-Token']
    delete authedApi.defaults.headers.common['X-Display-Secret']
  }
}

setDisplayCredentials(displayToken, displaySecret)

const authenticateDisplay = (token, secret) => {
  return publicApi.post('/pi/display/auth', {
    token,
    secret
  }).then(res => res.data)
}

const authenticateAdmin = (email, password) => {
  return authedApi.post('/pi/display/admin/login', {
    email,
    password
  }).then(res => res.data)
}

const hasDisplayCredentials = () => Boolean(displayToken && displaySecret)

export default {
  authenticateDisplay,
  authenticateAdmin,
  setDisplayCredentials,
  hasDisplayCredentials,
  getPropertyData (propertyId) {
    const path = propertyId ? `/pi/property/${propertyId}` : '/pi/display/property'
    return authedApi.get(path).then(res => res.data)
  },
  getWiFiQR (propertyId) {
    const path = propertyId ? `/pi/property/${propertyId}/wifi-qr` : '/pi/display/wifi-qr'
    return authedApi.get(path).then(res => res.data)
  },
  getActiveBooking (propertyId) {
    const path = propertyId ? `/pi/property/${propertyId}/active-booking` : '/pi/display/active-booking'
    return authedApi.get(path).then(res => res.data)
  },
  submitGuestReport (reportData) {
    return authedApi.post('/guest-reports', reportData).then(res => res.data)
  },
  getRouterStatus (propertyId) {
    const path = propertyId ? `/pi/property/${propertyId}/router/status` : '/pi/display/router/status'
    return authedApi.get(path).then(res => res.data)
  },
  rebootRouter (propertyId, params) {
    const url = propertyId ? `/pi/property/${propertyId}/router/reboot` : '/pi/display/router/reboot'
    return authedApi.post(url, null, { params }).then(res => res.data)
  },
  logTroubleshootingAccess (propertyId, data) {
    const url = propertyId ? `/pi/property/${propertyId}/troubleshooting/log` : '/pi/display/troubleshooting/log'
    return authedApi.post(url, data).then(res => res.data)
  }
}

