<template>
  <v-snackbar
      :color="color"
      :timeout="timer"
      v-model="showSnackbar"
      bottom
      right
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
  >
    <v-icon left>{{ icon }}</v-icon>
    {{ message }}
  </v-snackbar>
</template>

<script setup>
import {ref} from "vue";

const showSnackbar = ref(false);
const message = ref("");
const color = ref("success");
const icon = ref("mdi-check");
const timer = ref(3000);

const show = (data) => {
  message.value = data.message || 'missing "message".';
  color.value = data.color || "success";
  timer.value = data.timer || 3000;
  icon.value = data.icon || "mdi-check";
  showSnackbar.value = true;
};
</script>
