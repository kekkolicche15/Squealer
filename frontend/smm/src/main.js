/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";
import { createPinia } from "pinia";
// Composables
import { createApp } from "vue";
import VueVideoPlayer from "@videojs-player/vue";
import "video.js/dist/video-js.css";
import router from "./router";
// Plugins
import { registerPlugins } from "@/plugins";

const pinia = createPinia();

const app = createApp(App).use(pinia).use(router).use(VueVideoPlayer);

registerPlugins(app);

router.isReady().then(() => {
  app.mount("#app");
});
