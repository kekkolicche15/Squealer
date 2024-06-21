<script setup>
import PostCard from "@/components/PostCard.vue";
import {useRoute} from "vue-router";
import {
  baseUrl,
  emitter,
  fetchWrapper,
  CHUNK_SIZE,
} from "@/functions/request";
import {useUserStore} from "@/store/users";
import {onBeforeMount, onMounted, ref, watch, watchEffect} from "vue";
import router from "@/router";

const userStore = useUserStore();
const route = useRoute();
const id = route.params.id;
const current = ref(null);
const replies = ref([]);
const page = ref(1);
const length = ref(0);
const load = ref(false);
const refreshCurrent = async (postId) => {
  const data = await fetchWrapper.get(
      `${baseUrl}/post?id=${postId}&parent=true`,
  );
  if (!data.error) current.value = data.page[0];
};
const refreshReplies = async () => {
  const data = await fetchWrapper.get(
      `${baseUrl}/post/${id}/replies?page=${page.value}`,
  );
  if (!data.error) {
    replies.value = data.page;
    length.value = Math.ceil(data.count / CHUNK_SIZE);
  } else {
    replies.value = [];
    length.value = 0;
  }
};

const deleteMain = async () => {
  await router.push({name: "Home"});
};

onBeforeMount(async () => {
  const data = await fetchWrapper.get(
      `${baseUrl}/post?id=${id}&parent=true`,
  );
  if (data.error) {
    await router.push("/login");
  } else {
    current.value = data.page[0];
    await refreshReplies();
    emitter.on("posted", async function () {
      page.value = 1;
    });
    if (userStore.currentUser === null) {
      try {
        await userStore.LoginAccount();
      } catch (e) {
        await userStore.clearStore();
      }
    }
  }
});

onMounted(() => {
  watch(page, refreshReplies, {immediate: true});
});
</script>
<template>
  <div v-if="userStore.currentUser !== null">
    <PostCard
        v-if="current !== null && current.parent !== null"
        :key="current.parent._id"
        :post="current.parent"
        :width="'90vw'"
        @update-reaction="refreshCurrent"
        @delete-post="deleteMain"
        :role="'article'"
        :aria-label="'Parent Post'"
    ></PostCard>

    <PostCard
        v-if="current !== null"
        :key="current._id"
        :post="current"
        :width="'95%'"
        @update-reaction="refreshCurrent"
        @update-replies="refreshReplies"
        @delete-post="deleteMain"
        :role="'article'"
        :aria-label="'Current Post'"
    ></PostCard>

    <v-timeline
        side="end"
        truncate-line="both"
        v-if="!load && replies && replies.length > 0"
        aria-label="Timeline of Replies"
    >
      <v-timeline-item
          v-for="rep in replies"
          :key="rep"
          dot-color="dark"
          size="extra-small"
          width="90vw"
          role="complementary"
          aria-label="Reply"
      >
        <PostCard
            :post="rep"
            :key="rep._id"
            @update-reaction="refreshReplies"
            @delete-post="refreshReplies"
            :width="'100%'"
            role="article"
            aria-label="Reply Post"
        ></PostCard>
      </v-timeline-item>
    </v-timeline>
    <div v-if="load" class="d-flex justify-content-center w-100 my-10">
      <v-progress-circular
          :width="3"
          color="primary"
          indeterminate
          class="mx-auto"
      ></v-progress-circular>
    </div>
    <v-pagination
        v-if="length > 0 && !load"
        v-model="page"
        :length="length"
        :total-visible="Math.min(length, 5)"
    ></v-pagination>
  </div>
</template>
<style scoped></style>
