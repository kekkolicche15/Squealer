<script setup>
import {useUserStore} from "@/store/users";
import {baseUrl, emitter, fetchWrapper} from "@/functions/request";

const userStore = useUserStore();
const props = defineProps({
  user: Object,
});
const emits = defineEmits(["update-notification"]);
const accept = async () => {
  await fetchWrapper.post(
      `${baseUrl}/smm/managed-vips/${props.user.vip}`,
    null,
    null,
    true,
    "Richiesta mandata con successo",
  );
  emits("update-notification");
  emitter.emit("update-badge");
  emitter.emit("add-vip");
};
const refuse = async () => {
  await fetchWrapper.delete(
      `${baseUrl}/smm/managed-vips/${props.user.vip}`,
    true,
    "Richiesta mandata con successo",
  );
  emits("update-notification");
  emitter.emit("update-badge");
};
</script>

<template>
  <v-card
      class="rounded-xl"
      color="#fff"
      width="100%"
      height="100%"
      :title="props.user.vip"
      role="dialog"
      aria-labelledby="vip-title"
      aria-describedby="vip-description"
  >
    <template v-slot:subtitle class="emoji" id="vip-subtitle">
      vip&nbsp;🎩
    </template>
    <template v-slot:title id="vip-title">
      {{ props.user.vip }}
    </template>
    <template v-slot:prepend>
      <v-avatar
        class="mx-auto my-5"
        color="grey-darken-3"
        size="3rem"
        :image="`${baseUrl}/user/${props.user.vip}/picture`"
        alt="Avatar dell'utente VIP"
      >
      </v-avatar>
    </template>
    <v-card-text id="vip-description">
      Ti invita a essere il suo SMM, vuoi accettarlo?
    </v-card-text>
    <v-card-actions class="w-100 d-flex justify-space-around card-actions">
      <v-btn
          variant="text"
          @click="refuse"
          color="dangerous"
          aria-label="Rifiuta invito"
      >
        Refuse
      </v-btn>
      <v-btn
          variant="text"
          @click="accept"
          color="info"
          aria-label="Accetta invito"
      >
        Accept
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped></style>
