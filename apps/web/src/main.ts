import "@fontsource/ibm-plex-mono";
import "@fontsource/ibm-plex-sans";
import "@fontsource/zilla-slab";
import "./assets/main.css";

import { PiniaColada } from "@pinia/colada";
import { createPinia } from "pinia";
import { createApp } from "vue";
import { useAuthStore } from "@/stores/auth.store";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(PiniaColada);
app.use(router);

// Tente de rétablir la session à partir du cookie httpOnly. Volontairement
// pas attendu : l'interface s'affiche tout de suite et réagira au résultat.
// Avant mount(), pour que le refresh soit déjà en vol quand le routeur
// résoudra sa première navigation.
useAuthStore().refreshSession();

app.mount("#app");
