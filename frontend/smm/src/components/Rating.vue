<script setup>
import {baseUrl, fetchWrapper} from "@/functions/request";
import {useUserStore} from "@/store/users";
import {ref} from "vue";

const emits = defineEmits(["cancel", "refresh"]);
const userStore = useUserStore();
const rating = ref(0);
const review = ref("");
const props = defineProps({
  smm: Object,
});
const cancel = () => {
  emits("cancel");
};
const clear = () => {
  rating.value = 0;
  review.value = "";
};
const sendReview = async () => {
  const nReview = {};
  nReview.type = rating.value;
  nReview.text = review.value;
  await fetchWrapper.post(
      `${baseUrl}/smm/${props.smm.username}/reviews/`,
    nReview,
    "application/json",
    true,
  );
  clear();
  emits("refresh");
};
</script>
<template>
  <v-card
      class="mx-auto py-8 rounded-xl"
      elevation="10"
      height="auto"
      min-width="80vw"
      max-width="80vw"
      role="region"
      aria-label="User Review Section"
  >
    <v-list-item>
      <template v-slot:prepend>
        <v-avatar
          color="grey-darken-3"
          :image="`${baseUrl}/user/${userStore.currentUser.username}/picture`"
          alt="User Profile Picture"
        >
        </v-avatar>
      </template>
      <v-list-item-title
      >{{ userStore.currentUser.username }}
      </v-list-item-title>
    </v-list-item>
    <v-card-text class="w-100 d-flex justify-space-around card-actions">
      <v-rating
          v-model="rating"
          color="yellow-darken-3"
          half-increments
          aria-label="Rating"
      >
      </v-rating>
    </v-card-text>
    <v-card-text class="w-100 d-flex justify-space-around card-actions">
      <v-textarea
        label="Review"
        single-line
        variant="outlined"
        clearable
        no-resize
        v-model="review"
        placeholder="write your review"
        aria-label="Write your review here"
      >
      </v-textarea>
    </v-card-text>
    <v-card-actions class="w-100 d-flex justify-space-around card-actions">
      <v-list-item>
        <v-btn @click="cancel" aria-label="Cancel Review"> cancel</v-btn>
      </v-list-item>
      <v-list-item>
        <v-btn @click="sendReview" aria-label="Send Review"> send</v-btn>
      </v-list-item>
    </v-card-actions>
  </v-card>
</template>
<style scoped></style>
