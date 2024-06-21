<script setup>
import {computed} from "vue";
import {baseUrl} from "@/functions/request";

const props = defineProps({
  post: Object,
  category: String,
  symbol: String,
  general: Boolean,
  username: String,
  height: String,
  icon: Boolean,
});
const textPreview = computed(() => {
  return props.post === null
    ? `Non ci sono post ${props.category}`
    : props.post.content
      ? props.post.content.slice(0, 250) + "..."
      : "";
});
</script>

<template>
  <v-card
    class="mx-auto rounded-xl"
    color="#fff"
    :min-height="props.height"
    :to="
      props.post && props.post._id
        ? { name: 'Post', params: { id: props.post._id } }
        : null
    "
  >
    <v-list-item>
      <template v-slot:prepend v-if="props.icon === true">
        <v-avatar
          color="grey-darken-3"
          :image="`${baseUrl}/user/${props.username}/picture`"
        ></v-avatar>
      </template>
      <template v-slot:append v-if="props.category && props.symbol">
        <span class="text-h5 text-capitalize emoji"
        >{{ props.category }} {{ props.symbol }}</span
        >
      </template>
      <v-list-item-title>{{ props.username }}</v-list-item-title>
      <v-list-item-subtitle
        v-if="props.post && props.post.channel && props.post.icon === true"
      >{{ decodeURIComponent(props.post.channel) }}
      </v-list-item-subtitle>
    </v-list-item>
    <v-card-text cclass="font-weight-regular py-2">
      {{ textPreview }}
    </v-card-text>
  </v-card>
</template>

<style scoped>
@import url(https://fonts.googleapis.com/css2?family=Noto+Color+Emoji);

.emoji {
  font-family: "Noto Color Emoji", sans-serif;
}
</style>
