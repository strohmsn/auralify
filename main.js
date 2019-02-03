// Routing takes place here
var Vue = require("vue");
var VueRouter = require("vue-router");
var MidiScalesPlayer = require("./MidiScalesPlayer.vue");
var PitchVisualizer = require("./PitchVisualizer.vue");
Vue.use(VueRouter);

const routes = [
  { path: "/midi-scales-player", component: MidiScalesPlayer },
  { path: "/pitch-visualizer", component: PitchVisualizer }
]

const router = new VueRouter({
  routes: routes
})

const app = new Vue({
  router
}).$mount('#app')
