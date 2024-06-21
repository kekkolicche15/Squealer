<script setup>
import {useUserStore} from "@/store/users";
import {baseUrl, fetchWrapper, CHUNK_SIZE} from "@/functions/request";
import Rating from "@/components/Rating.vue";
import {computed, onMounted, ref, watchEffect} from "vue";
import router from "@/router";
const emits = defineEmits(["refresh"]);
const userStore = useUserStore();
const props = defineProps({
  smm: Object,
});

const sendRequest = async () => {
  await fetchWrapper.post(
      `${baseUrl}/smm/${props.smm.username}/waiting-list/`,
      null,
      null,
      true,
      "Richiesta mandata con successo",
  );
  emits("refresh");
};
const deleteRequest = async () => {
  await fetchWrapper.delete(
      `${baseUrl}/smm/${props.smm.username}/waiting-list/`,
      true,
      "Richiesta mandata con successo",
  );
  emits("refresh");
};
const quitSmm = async () => {
  await fetchWrapper.delete(`${baseUrl}/smm/manager/`, false, {
    msg: "Smm quittato con successo",
    color: "green-accent-1",
  });
  emits("refresh");
  await userStore.updateData();
};
const rating = ref(4.5);
const openReview = ref(false);
const openRating = ref(false);
//reviews part
const listToRender = ref([]);
const page = ref(1);
const load = ref(false);
const maxPage = computed(() => {
  return Math.ceil(props.smm.reviewCount / CHUNK_SIZE);
});
const refreshReviews = async () => {
  load.value = true;
  const data = await fetchWrapper.get(
      `${baseUrl}/smm/${props.smm.username}/reviews/?page=${page.value}`,
  );
  load.value = false;
  if (!data.error) {
    listToRender.value = data.reviews;
  }
};

const closeRating = async () => {
  await refreshReviews();
  emits("refresh");
  openRating.value = false;
};

onMounted(async () => {
  if (userStore.currentUser === null) {
    try {
      await userStore.LoginAccount();
    } catch (e) {
      await userStore.clearStore();
    }
  }
  watchEffect(refreshReviews);
});
</script>
<template>
  <v-dialog
      v-model="openRating"
      aria-labelledby="ratingDialogTitle"
      role="dialog"
  >
    <rating
        :smm="props.smm"
        @cancel="openRating = false"
        @refresh="closeRating"
    ></rating>
  </v-dialog>
  <v-dialog
      v-model="openReview"
      aria-labelledby="reviewDialogTitle"
      role="dialog"
  >
    <v-card
        class="mx-auto py-8 rounded-xl"
        elevation="10"
        min-height="80vh"
        min-width="40vw"
        max-width="80vw"
    >
      <v-row>
        <v-col cols="12">
          <v-img
              contain
              height="20vh"
              :src="`${baseUrl}/user/${props.smm.username}/picture`"
              style="flex-basis: 30vw"
              class="flex-grow-0"
              alt="Profile picture of {{ props.smm.username }}"
          ></v-img>
        </v-col>
        <v-col class="d-flex justify-content-center" cols="12">
          <div class="adjustable text-h2 mx-auto">
            {{ props.smm.username }}
          </div>
        </v-col>
        <v-col class="d-flex justify-content-center" cols="12">
          <div class="adjustable text-body-1 mx-auto">
            <span class="emoji">📝</span> Description:
            {{ props.smm.description }}
          </div>
        </v-col>
        <v-col class="d-flex justify-content-center" cols="12">
          <div class="adjustable text-body-1 mx-auto">
            <span class="emoji">💵</span> Cost per month: {{ props.smm.cost }}
          </div>
        </v-col>
        <v-col class="d-flex justify-content-center" cols="12">
          <div class="adjustable text-body-1 mx-auto">
            <span class="emoji">🧑‍💼</span> Managing vips:
            {{ props.smm.currentVipCount }}/{{ props.smm.maxVipCount }}
          </div>
        </v-col>
        <v-col class="d-flex align-center flex-column">
          <div class="text-h2 mt-5 mx-auto">
            {{ props.smm.rating }}
            <span class="text-h6 ml-n3">/5</span>
          </div>
          <v-rating
              :model-value="props.smm.rating"
              readonly
              color="yellow-darken-3"
              half-increments
          ></v-rating>
          <div class="px-3">{{ props.smm.reviewCount }} reviews</div>
        </v-col>
        <v-col class="d-flex justify-content-center" cols="12">
          <v-btn
              class="mx-auto"
              v-if="userStore.currentUser.role !== 'smm'"
              @click="openRating = !openRating"
              aria-label="Write a comment"
          >
            Write a comment
          </v-btn>
          <v-btn
              class="rounded-xl mx-auto"
              prepend-icon="mdi-plus"
              color="green-accent-2"
              v-if="
              userStore.currentUser.role !== 'smm' &&
              !props.smm.requestStatus &&
              props.smm.currentVipCount < props.smm.maxVipCount
            "
              @click="sendRequest"
              aria-label="Send request"
          >
            Fai la richiesta
          </v-btn>
          <v-btn
              class="rounded-xl mx-auto"
              prepend-icon="mdi-close"
              color="yellow-accent-2"
              v-if="
              userStore.currentUser.role !== 'smm' &&
              props.smm.requestStatus === 'waiting'
            "
              @click="deleteRequest"
              aria-label="Cancel request"
          >
            Annulla la richiesta
          </v-btn>
          <v-btn
              class="rounded-xl mx-auto"
              prepend-icon="mdi-close"
              color="red-accent-2"
              v-if="
              userStore.currentUser.role !== 'smm' &&
              props.smm.requestStatus === 'accepted'
            "
              @click="quitSmm"
              aria-label="Leave Smm"
          >
            Lascia Smm
          </v-btn>
        </v-col>
        <v-divider></v-divider>
        <v-col class="d-flex justify-content-center" cols="12">
          <div class="mx-auto text-h5">Reviews</div>
        </v-col>
        <v-divider></v-divider>
        <v-col cols="12" v-for="review in listToRender" :key="review.id">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar
                  color="grey-darken-3"
                  :image="`${baseUrl}/user/${review.vip.username}/picture`"
                  alt="Profile picture of {{ review.vip.username }}"
              ></v-avatar>
            </template>
            <v-list-item-title>{{ review.vip.username }}</v-list-item-title>
            <template v-slot:append>
              <v-rating
                  :model-value="review.type"
                  readonly
                  color="yellow-darken-3"
                  half-increments
              ></v-rating>
            </template>
          </v-list-item>
          <v-card-text>
            {{ review.text }}
          </v-card-text>
          <v-divider></v-divider>
        </v-col>
        <v-col cols="12">
          <div v-if="load" class="d-flex justify-content-center w-100 my-10">
            <v-progress-circular
                :width="3"
                color="primary"
                indeterminate
                class="mx-auto"
            ></v-progress-circular>
          </div>
          <v-pagination
              v-if="maxPage > 0 && !load"
              v-model="page"
              :length="maxPage"
              :total-visible="Math.min(maxPage, 5)"
          ></v-pagination>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>

  <v-card
      class="mx-auto rounded-xl"
      color="blue-accent-1"
      elevation="10"
      min-width="40vw"
      max-width="80vw"
  >
    <div class="d-flex justify-content-center">
      <v-card-title class="flex-grow-1 flex-column align-center">
        <div class="text-h5">
          {{ props.smm.username }}
        </div>
        <div class="adjustable text-body-1 font-weight-thin">
          <span class="emoji">💵</span> Cost per month:
          {{ props.smm.cost }}
        </div>
        <div class="adjustable text-body-1 font-weight-thin">
          <span class="emoji">🧑‍💼</span> Managing vips:
          {{ props.smm.currentVipCount }}/{{ props.smm.maxVipCount }}
        </div>
      </v-card-title>
      <v-img
          contain
          height="25%"
          :src="`${baseUrl}/user/${props.smm.username}/picture`"
          style="flex-basis: 25%"
          class="flex-grow-0"
          alt="Profile picture of {{ props.smm.username }}"
      ></v-img>
    </div>
    <v-divider></v-divider>
    <v-card-actions class="pa-4">
      <v-btn
          @click="openReview = !openReview"
          aria-label="See details about {{ props.smm.username }}"
      >
        See details
      </v-btn>
      <v-spacer></v-spacer>
      <span class="text-grey-lighten-2 text-caption me-2">
        ({{ props.smm.rating }})
      </span>
      <v-rating
          v-model="props.smm.rating"
          color="white"
          active-color="yellow-accent-4"
          half-increments
          readonly
          hover
          size="18"
      ></v-rating>
    </v-card-actions>
  </v-card>
</template>
<style scoped>
@import url(https://fonts.googleapis.com/css2?family=Noto+Color+Emoji);

.emoji {
  font-family: "Noto Color Emoji", sans-serif;
}
</style>
