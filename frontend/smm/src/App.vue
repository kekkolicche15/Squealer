<script setup>
import AppNav from "@/components/AppNav.vue";
import Text from "@/components/Text.vue";
import { useUserStore } from "./store/users";
import {useRegexStore} from "@/store/regex";
import {emitter} from "@/functions/request";
import {onMounted, ref} from "vue";
const store = useUserStore();
const regexStore = useRegexStore();
const userStore = useUserStore();
const snack = ref(false);
const text = ref("");
const color = ref("blue");
const openWriteDialog = ref(false);
const handleWrite = () => {
  openWriteDialog.value = true;
};

const handleSession = async () => {
  await userStore.clearStore();
}

onMounted(async () => {
  try {
    await regexStore.fetchRegexes();
    const handleSnack = (e) => {
      snack.value = true;
      color.value = e.color;
      text.value = e.msg;
    };
    emitter.on("snack", handleSnack);
    emitter.on("write", handleWrite);
    emitter.on("session", handleSession);
  } catch (error) {
    // Gestisci l'errore qui, ad esempio stampandolo in console
    console.error(error);
  }
});
</script>
<template>
  <v-app>
    <v-snackbar
        v-model="snack"
        multi-line
        rounded="pill"
        width="auto"
        :color="color"
        :timeout="2000"
        :transition="'scroll-x-reverse-transition'"
        role="alert"
        aria-live="assertive"
    >
      <div class="text-subtitle-1 pl-2 font-weight-medium">{{ text }}</div>
      <template v-slot:actions>
        <v-btn
            color="dark"
            variant="text"
            @click="snack = false"
            icon="mdi-close"
            aria-label="Close notification"
        >
        </v-btn>
      </template>
    </v-snackbar>
    <Suspense>
      <AppNav v-if="userStore.currentUser !== null"></AppNav>
    </Suspense>
    <Transition name="fade" mode="out-in" appear>
      <v-main role="main" aria-label="Main Content">
        <v-dialog v-model="openWriteDialog" scrollable>
          <Text></Text>
        </v-dialog>
        <Suspense>
          <router-view :key="$route.fullPath"></router-view>
          <template #fallback>
            <div class="d-flex justify-content-center w-100">
              <v-progress-circular
                :width="3"
                color="primary"
                indeterminate
                class="mx-auto"
                role="progressbar"
                aria-valuetext="Loading content"
              ></v-progress-circular>
            </div>
          </template>
        </Suspense>
      </v-main>
    </Transition>
  </v-app>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
