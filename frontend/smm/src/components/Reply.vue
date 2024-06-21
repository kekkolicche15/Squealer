<script setup>
import {baseUrl} from "@/functions/request";
import PostPreview from "@/components/PostPreview.vue";
const props = defineProps({
  post: Object,
});
</script>

<template>
  <v-card
      class="mx-auto rounded-xl"
      color="#fff"
      :to="
      props.post && props.post._id
        ? { name: 'Post', params: { id: props.post._id } }
        : null
    "
      aria-label="Reply card"
  >
    <v-list-item>
      <template v-slot:prepend>
        <v-avatar
            color="grey-darken-3"
            :image="`${baseUrl}/user/${props.post.author}/picture`"
            alt="Author's profile picture"
        ></v-avatar>
      </template>
      <template v-slot:append v-if="props.category && props.symbol">
        <span class="text-h5 text-capitalize emoji"
        >{{ props.category }} {{ props.symbol }}</span
        >
      </template>
      <v-list-item-title>{{ props.post.author }}</v-list-item-title>
    </v-list-item>
    <v-card-text class="font-weight-regular py-2">
      Ti ha risposto:
      <PostPreview
          class="my-5"
          :post="props.post.parent"
          :username="props.post.parent.author"
          :width="'100%'"
          :height="'auto'"
          :icon="false"
      >
      </PostPreview>
    </v-card-text>
  </v-card>
</template>

<style scoped>
@import url(https://fonts.googleapis.com/css2?family=Noto+Color+Emoji);

.emoji {
  font-family: "Noto Color Emoji", sans-serif;
}
</style>
