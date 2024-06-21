<script setup>
import {onMounted, reactive, ref} from "vue";
import {useVuelidate} from "@vuelidate/core";
import {useRouter} from "vue-router";
import {required} from "@vuelidate/validators";
import {useUserStore} from "@/store/users";

const accountStore = useUserStore();
const router = useRouter();
const image = ref(0);
const initialState = {
  name: "",
  password: "",
};
const state = reactive({
  ...initialState,
});

const rules = {
  name: { required },
  password: { required },
};

const v$ = useVuelidate(rules, state);
const visible = ref(false);

function clear() {
  v$.value.$reset();
  for (const [key, value] of Object.entries(initialState)) {
    state[key] = value;
  }
}

const log = async () => {
  v$.value.$validate();
  if (!v$.value.$invalid) {
    await accountStore.login(state.name, state.password);
    try {
      await accountStore.LoginAccount();
    } catch (e) {
      await accountStore.clearStore();
    }
  }
};
onMounted(() => {
  setInterval(function () {
    image.value = Math.floor(Math.random() * 100);
  }, 10000);
});
</script>

<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card
        class="pa-12 pb-8 flex-grow-1 mx-10"
        elevation="8"
        max-width="448"
        rounded="lg"
        style="background-color: rgba(255, 255, 255, 0.5)"
        role="form"
        aria-label="Login form"
    >
      <v-form @submit.prevent="log">
        <div class="text-subtitle-1 text-center text-medium-emphasis">
          <v-icon
              color="info"
              icon="mdi-account-box"
              size="x-large"
              aria-hidden="true"
          ></v-icon>
        </div>
        <v-text-field
            density="compact"
            placeholder="Username"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            v-model="state.name"
            :error-messages="v$.name.$errors.map((e) => e.$message)"
            label="Username"
            required
            class="my-7"
            @input="v$.name.$touch"
            @blur="v$.name.$touch"
            ref="el"
            aria-label="Enter your username"
        ></v-text-field>
        <v-text-field
            :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
            :type="visible ? 'text' : 'password'"
            density="compact"
            placeholder="Enter your password"
            prepend-inner-icon="mdi-lock-outline"
            variant="outlined"
            @click:append-inner="visible = !visible"
            v-model="state.password"
            :error-messages="v$.password.$errors.map((e) => e.$message)"
            label="Password"
            class="my-7"
            required
            @input="v$.password.$touch"
            @blur="v$.password.$touch"
            aria-label="Enter your password"
        ></v-text-field>
        <div class="d-flex justify-space-around flex-column flex-md-row">
          <v-btn
              type="submit"
              class="mb-8"
              color="blue"
              size="large"
              variant="tonal"
              aria-label="Submit form"
          >
            submit
          </v-btn>
          <v-btn
              @click="clear"
              class="mb-8"
              color="red"
              size="large"
              variant="tonal"
              aria-label="Clear form"
          >
            clear
          </v-btn>
        </div>
      </v-form>
    </v-card>
    <v-card
        class="flex-grow-1 d-none d-md-flex d-md-none"
        elevation="8"
        max-height="448"
        max-width="720"
        rounded="lg"
        @click="image = Math.floor(Math.random() * 50)"
        role="presentation"
        aria-hidden="true"
    >
      <v-img
          :src="`https://picsum.photos/500/300?image=${image}`"
          :lazy-src="`https://picsum.photos/10/6?image=${image}`"
          cover
          class="bg-grey-lighten-2"
          alt="Random image"
      >
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-progress-circular
                indeterminate
                color="grey-lighten-5"
                aria-label="Loading image"
            ></v-progress-circular>
          </v-row>
        </template>
      </v-img>
    </v-card>
  </div>
</template>

<!--main{-->
<!--background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);-->
<!--background-size: 400% 400%;-->
<!--animation: gradient 15s ease infinite;-->
<!--}-->

<!--@keyframes gradient {-->
<!--0% {-->
<!--background-position: 0 50%;-->
<!--}-->
<!--50% {-->
<!--background-position: 100% 50%;-->
<!--}-->
<!--100% {-->
<!--background-position: 0 50%;-->
<!--}-->
<!--}-->

<style scoped></style>
