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
    authedApi.defaults.headers.common['X-Display-Token'] = displayToken
    authedApi.defaults.headers.common['X-Display-Secret'] = displaySecret
  } else {
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

const hasDisplayCredentials = () => Boolean(displayToken && displaySecret)

export default {
  authenticateDisplay,
  setDisplayCredentials,
  hasDisplayCredentials,
  getPropertyData () {
    return authedApi.get('/pi/display/property').then(res => res.data)
  },
  getWiFiQR () {
    return authedApi.get('/pi/display/wifi-qr').then(res => res.data)
  },
  getActiveBooking () {
    return authedApi.get('/pi/display/active-booking').then(res => res.data)
  },
  submitGuestReport (reportData) {
    return authedApi.post('/guest-reports', reportData).then(res => res.data)
  },
  getRouterStatus () {
    return authedApi.get('/pi/display/router/status').then(res => res.data)
  },
  rebootRouter (params) {
    return authedApi.post('/pi/display/router/reboot', null, { params }).then(res => res.data)
  },
  logTroubleshootingAccess (data) {
    return authedApi.post('/pi/display/troubleshooting/log', data).then(res => res.data)
  }
}

