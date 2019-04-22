// Routing takes place here
import Vue from "vue";
import VueRouter from "vue-router";
import MidiScalesPlayer from "./components/MidiScalesPlayer.vue";
import PitchVisualizer from "./components/PitchVisualizer.vue";

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
