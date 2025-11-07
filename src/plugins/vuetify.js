import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    options: {
      customProperties: true
    },
    themes: {
      light: {
        primary: '#1976D2',
        secondary: '#424242',
        accent: '#82B1FF',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#FF5252',
        background: '#F4F7FB'
      },
      dark: {
        primary: '#2196F3',
        secondary: '#90A4AE',
        accent: '#82B1FF',
        info: '#64B5F6',
        success: '#81C784',
        warning: '#FFB74D',
        error: '#FF8A80',
        background: '#121212'
      }
    }
  },
  icons: {
    iconfont: 'mdi'
  }
})


