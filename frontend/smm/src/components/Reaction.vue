<script setup>
import {baseUrl} from "@/functions/request";
import PostPreview from "@/components/PostPreview.vue";

const props = defineProps({
  reaction: Object,
});

const emojis = {
  1: "👍",
  2: "😊",
  3: "😄",
  4: "😍",
  "-1": "👎",
  "-2": "🙁",
  "-3": "😵",
  "-4": "😡",
};
</script>

<template>
  <v-card
      class="mx-auto rounded-xl"
      color="#fff"
      :min-height="props.height"
      role="article"
      aria-label="User Reaction"
  >
    <v-list-item>
      <template v-slot:prepend>
        <v-avatar
            color="grey-darken-3"
            :image="`${baseUrl}/user/${props.reaction.user}/picture`"
            alt="Avatar dell'utente"
        ></v-avatar>
      </template>
      <template v-slot:append>
        <div>
          <v-list-item-subtitle
          >{{ props.reaction.date }}
            {{ props.reaction.time }}
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="props.reaction.location"
          >{{ decodeURIComponent(props.reaction.location) }}
          </v-list-item-subtitle>
        </div>
      </template>
      <v-list-item-title>{{ props.reaction.user }}</v-list-item-title>
    </v-list-item>
    <v-card-text class="font-weight-regular py-2">
      Ti ha messo: <span class="emoji">{{ emojis[props.reaction.type] }}</span>
      <PostPreview
          class="my-5"
          :post="props.reaction.post"
          :width="'100%'"
          :height="'auto'"
          :username="props.reaction.post.author"
          :icon="false"
          role="complementary"
          aria-label="Anteprima del post"
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
