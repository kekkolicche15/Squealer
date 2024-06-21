<script setup>
import {computed, ref} from "vue";
import {useUserStore} from "@/store/users";
import {fetchWrapper} from "@/functions/request";

const userStore = useUserStore();
const props = defineProps({
  minQuotaToBuy: Number,
});
const emits = defineEmits(["closeQuota"]);
const buyquota = async () => {
  await fetchWrapper.patch(
    `${userStore.userUrl}/buy/quota/?amount=${convertedQuota.value}`,
    null,
    "application/json",
    true,
    "Quota comprata con successo",
  );
  await userStore.updateData();
  emits("closeQuota");
};
const buyscore = async () => {
  await fetchWrapper.patch(
    `${userStore.userUrl}/buy/score/?amount=${scoreToBuy.value}`,
    null,
    "application/json",
    true,
    "Score comprato con successo",
  );
};
const buy = async () => {
  if (minScoreToBuy.value !== 0) await buyscore();
  await buyquota();
  await userStore.updateData();
};
const scoreToBuy = ref("");
const minScoreToBuy = computed(() => {
  return userStore.currentUser.score >= props.minQuotaToBuy
    ? 0
    : props.minQuotaToBuy - userStore.currentUser.score;
});
const quotaToBuy = ref(String(props.minQuotaToBuy));
const isDigit = (str) => {
  return /^\d+$/.test(str); // Verifica se la stringa contiene solo cifre
};

const convertedQuota = computed(() => {
  return userStore.sameUser
    ? Math.floor(parseInt(quotaToBuy.value) / 5)
    : Math.floor(parseInt(quotaToBuy.value) / 10);
});

const checkValidInput = () => {
  if (
    !isDigit(quotaToBuy.value) ||
    !(parseInt(quotaToBuy.value) >= props.minQuotaToBuy)
  ) {
    quotaToBuy.value = props.minQuotaToBuy;
  }
};

const checkValidScore = () => {
  if (
    !isDigit(quotaToBuy.value) ||
    !(parseInt(quotaToBuy.value) >= minScoreToBuy.value)
  ) {
    quotaToBuy.value = minScoreToBuy.value;
  }
};
</script>
<template>
  <v-card class="px-6 py-8 rounded-xl">
    <v-form>
      <!-- Titolo con accessibilità migliorata -->
      <v-row class="justify-content-center">
        <span class="text-h3 mx-auto">
          Compra quota
          <span
              v-if="!userStore.sameUser"
              class="bg-red-accent-3 text-white px-5 rounded-xl"
              role="alert"
          >
            a un prezzo maggiorato
          </span>
        </span>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
              label="Score"
              v-model.number="quotaToBuy"
              type="number"
              @keyup="checkValidInput"
              :min="props.minQuotaToBuy"
              aria-label="Inserisci lo score per la quota da acquistare"
          >
          </v-text-field>
        </v-col>
        <v-col>
          <v-text-field
              label="Quota"
              disabled
              type="number"
              v-model="convertedQuota"
              aria-label="Quota convertita visualizzata"
          >
          </v-text-field>
        </v-col>
      </v-row>

      <v-row v-if="minScoreToBuy !== 0">
        <v-col>
          <v-text-field
              label="Euro"
              v-model="scoreToBuy"
              type="number"
              @keyup="checkValidScore"
              :min="minScoreToBuy"
              prefix="€"
              aria-label="Inserisci l'importo in euro per la quota da acquistare"
          >
          </v-text-field>
        </v-col>
        <v-col>
          <v-text-field
              label="Score"
              disabled
              type="number"
              v-model="scoreToBuy"
              aria-label="Score convertito visualizzato"
          >
          </v-text-field>
        </v-col>
      </v-row>
      <v-row class="justify-content-center">
        <v-btn
            class="mx-auto"
            color="primary"
            @click="buy"
            aria-label="Acquista quota"
        >buy
        </v-btn>
      </v-row>
    </v-form>
  </v-card>
</template>

<style scoped>
.emoji {
  font-family: "Noto Color Emoji", sans-serif;
}
</style>
