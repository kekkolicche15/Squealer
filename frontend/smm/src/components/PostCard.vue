<script setup>
import {baseUrl, fetchWrapper} from "@/functions/request";
import {useUserStore} from "@/store/users";
import Comment from "@/components/Comment.vue";
import {computed, ref} from "vue";
import router from "@/router";
import {useRoute} from "vue-router";
import {useDisplay} from 'vuetify';

const {mdAndUp} = useDisplay();
const userStore = useUserStore();
const route = useRoute();
const emits = defineEmits(["updateReaction", "updateReplies", "deletePost"]);
const openComment = ref(false);
const props = defineProps({
  post: Object,
  width: String,
  role: String,
  ariaLabel: String,
});
const fileToRender = ref(null);
const attachmentUrl = `${baseUrl}/post/${props.post._id}/attachment`;
const givingReaction = ref(false);
const giveReaction = async (key) => {
  givingReaction.value = true;
  if (props.post.userReaction === 0)
    await fetchWrapper.post(
      `${userStore.postUrl}/${props.post._id}/reactions`,
        {reaction: key},
      "application/json",
      true,
      "Reazione impostata con successo",
    );
  else if (props.post.userReaction === Number(key))
    await fetchWrapper.delete(
      `${userStore.postUrl}/${props.post._id}/reactions`,
      true,
      "Reazione impostata con successo",
    );
  else
    await fetchWrapper.patch(
      `${userStore.postUrl}/${props.post._id}/reactions`,
        {reaction: key},
      "application/json",
      true,
      "Reazione impostata con successo",
    );
  emits("updateReaction", props.post._id);
  givingReaction.value = false;
};
const renderType = ["video", "image"];
const showVideo = computed(() => {
  return props.post.contentType === renderType[0];
});

const showImage = computed(() => {
  return props.post.contentType === renderType[1];
});

const redirect = () => {
  router.push({name: "Post", params: {id: props.post._id}});
};

const deletePost = async () => {
  await fetchWrapper.delete(
    `${userStore.postUrl}/${props.post._id}`,
    true,
    "post cancellato con successo",
  );
  emits("deletePost", props.post._id);
};

const convertLinksToAnchors = () => {
  let content = props.post.content;
  for (const key in props.post.references) {
    if (props.post.references.hasOwnProperty(key)) {
      const keyModificata = key.replace(/!/g, '');
      const anchor = `<a href="${props.post.references[key]}">${keyModificata}</a>`;
      while (content.indexOf(key) !== -1) {
        content = content.replace(key, anchor);
      }
    }
  }
  return `<span>${content}</span>`;
}

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
  <v-dialog
    v-model="openComment"
    class="text-h5 py-5"
    max-width="100vw"
    max-height="60vh"
  >
    <v-card
      class="mx-auto rounded-xl relative"
      color="#fff"
      width="100%"
      height="100%"
    >
      <v-timeline class="my-10" side="end" truncate-line="both">
        <v-timeline-item dot-color="dark" size="extra-small" width="70vw">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar
                color="grey-darken-3"
                :image="`${baseUrl}/user/${props.post.author}/picture`"
              >
              </v-avatar>
            </template>
            <v-list-item-title>{{ props.post.author }}</v-list-item-title>
            <v-list-item-subtitle v-if="props.post.channel"
            >{{ decodeURIComponent(props.post.channel) }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-card-text class="font-weight-regular py-2"
                       v-html="convertLinksToAnchors(props.post.content)"></v-card-text>
          <v-card-text
            class="d-flex justify-space-around px-16 mx-auto"
            v-if="showImage || showVideo"
          >
            <img
              class="bordered rounded-lg elevation-2"
              v-if="showImage"
              :src="attachmentUrl"
              alt=""
            />
            <video v-if="showVideo" controls type="video/mp4">
              <source :src="attachmentUrl"/>
            </video>
          </v-card-text>
        </v-timeline-item>
        <v-timeline-item
          dot-color="dark"
          size="extra-small"
          width="100%"
          tag="v-avatar"
        >
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar
                color="grey-darken-3"
                :image="`${baseUrl}/user/${userStore.currentUser.username}/picture`"
              ></v-avatar>
            </template>
            <v-list-item-title
            >{{ userStore.currentUser.username }}
            </v-list-item-title>
          </v-list-item>
          <v-card-text>
            <Comment
              :post-id="props.post._id"
              @update-replies="
                emits('updateReplies');
                openComment = false;
              "
            ></Comment>
          </v-card-text>
        </v-timeline-item>
      </v-timeline>
    </v-card>
  </v-dialog>
  <v-card
    class="mx-auto rounded-xl mt-5"
    color="#fff"
    :width="props.width"
    :to="
      props.post._id !== route.params.id
        ? { name: 'Post', params: { id: props.post._id } }
        : {}
    "
  >
    <v-list-item>
      <template v-slot:prepend>
        <v-avatar
          color="grey-darken-3"
          :image="`${baseUrl}/user/${props.post.author}/picture`"
        >
        </v-avatar>
      </template>
      <template v-slot:append>
        <v-row class="w-100 d-flex justify-space-around">
          <v-list-item-subtitle class="mx-5"
          >
            <div class="d-flex flex-column">
              <div>{{ props.post.date }}</div>
              <div>{{ props.post.time }}</div>
            </div>
          </v-list-item-subtitle>
          <v-list-item-subtitle class="mx-5" v-if="props.post.location"
          >{{ decodeURIComponent(props.post.location) }}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            <v-btn
              icon
              size="sm"
              class="mx-5"
              variant="text"
              v-if="userStore.currentUser.username === props.post.author"
              @click.stop.prevent="deletePost"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-subtitle>
        </v-row>
      </template>
      <v-list-item-title>{{ props.post.author }}</v-list-item-title>
      <v-list-item-subtitle>{{ decodeURIComponent(props.post.channel) }}</v-list-item-subtitle>
    </v-list-item>
    <v-card-text class="font-weight-regular py-2" v-html="convertLinksToAnchors()">
    </v-card-text>
    <v-card-text
      class="d-flex justify-space-around px-16 mx-auto"
      v-if="showImage || showVideo"
    >
      <img
        class="bordered rounded-lg elevation-2"
        v-if="showImage"
        :src="attachmentUrl"
        alt=""
      />
      <video v-if="showVideo" controls type="video/mp4">
        <source :src="attachmentUrl"/>
      </video>
    </v-card-text>
    <v-card-actions class="w-100 d-flex justify-space-around card-actions">
      <v-list-item>
        <div>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-emoticon-outline"
                variant="text"
                v-bind="props"
                @click.stop.prevent
              >
              </v-btn>
            </template>
            <v-list class="d-flex flex-wrap justify-lg-space-between" max-width="70vw">
              <v-list-item
                v-for="(value, key) in props.post.reactions"
                :key="key"
              >
                <v-list-item-title>
                  <v-btn
                    prepend-icon="mdi-emoticon-outline"
                    variant="text"
                    @click.stop.prevent="giveReaction(key)"
                    :disabled="givingReaction"
                    size="large"
                  >
                    <template v-slot:prepend>
                      <span class="emoji">{{ emojis[key] }}</span>
                    </template>
                    {{ value }}
                  </v-btn>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-list-item>
      <v-list-item>
        <div>
          <v-btn
            class="me-1"
            icon="mdi-comment-outline"
            variant="text"
            @click.stop.prevent="openComment = !openComment"
          >
          </v-btn>
        </div>
      </v-list-item>
      <v-list-item>
        <div>
          <v-icon class="me-1" icon="mdi-chart-bar"></v-icon>
          <span class="subheading">{{ props.post.views }}</span>
        </div>
      </v-list-item>
    </v-card-actions>
  </v-card>
</template>
<style scoped>
@import url(https://fonts.googleapis.com/css2?family=Noto+Color+Emoji);

.emoji {
  font-family: "Noto Color Emoji", sans-serif;
}

img {
  max-width: 50vw;
  max-height: 50vh;
}

video {
  max-width: 50vw;
  max-height: 50vh;
}

.relative {
  position: relative;
  flex-grow: 0;
}
</style>
