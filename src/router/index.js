import Vue from 'vue'
import VueRouter from 'vue-router'
import WelcomeDisplay from '../components/WelcomeDisplay.vue'
import Troubleshooting from '../views/Troubleshooting.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: WelcomeDisplay,
    props: true
  },
  {
    path: '/troubleshooting',
    name: 'Troubleshooting',
    component: Troubleshooting,
    props: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router

