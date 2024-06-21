<script setup>
import {onMounted, ref} from "vue";
import {emitter, fetchWrapper} from "@/functions/request";
import {useUserStore} from "@/store/users";
import PostPreview from "@/components/PostPreview.vue";
const userStore = useUserStore();
const posts = ref([]);
const loading = ref(true);
const categoryArray = [
  {
    category: "normale",
    icon: "🌟",
  },
  {
    category: "popolare",
    icon: "🔥",
  },
  {
    category: "controverso",
    icon: "💢",
  },
  {
    category: "impopolare",
    icon: "🫥",
  },
];
const getPosts = async () => {
  loading.value = true;
  // console.log(userStore.postUrl + `/?popularity=normal&sort=oldest&author=${userStore.currentUser.username}`)
  const data = await Promise.all([
    fetchWrapper.get(
      userStore.postUrl +
        `/?popularity=normal&sort=oldest&author=${userStore.currentUser.username}`,
    ),
    fetchWrapper.get(
      userStore.postUrl +
        `/?popularity=popular&sort=oldest&author=${userStore.currentUser.username}`,
    ),
    fetchWrapper.get(
      userStore.postUrl +
        `/?popularity=controversial&sort=oldest&author=${userStore.currentUser.username}`,
    ),
    fetchWrapper.get(
      userStore.postUrl +
        `/?popularity=unpopular&sort=oldest&author=${userStore.currentUser.username}`,
    ),
  ]);
  posts.value = data.map((post) => {
    return (post.error || post.page.length === 0) ? null : post.page[0];
  });
  loading.value = false;
};

onMounted(async () => {
  await getPosts();
  emitter.on("refresh", async () => await getPosts());
});
</script>

<template>
  <v-sheet>
    <div
      class="text-center text-capitalize text-h4 my-3 colorful font-weight-bold"
    >
      News
    </div>
    <v-carousel
      :show-arrows="false"
      cycle
      hide-delimiter-background
      v-if="!loading"
      height="auto"
      class="elevation-10 rounded-xl"
    >
      <v-carousel-item v-for="(post, i) in posts" :key="i">
        <PostPreview
          :post="post"
          :category="categoryArray[i].category"
          :symbol="categoryArray[i].icon"
          :general="true"
          :username="userStore.currentUser.username"
          :height="'30vh'"
          :icon="true"
        >
        </PostPreview>
      </v-carousel-item>
    </v-carousel>
    <div v-if="loading" class="d-flex justify-content-center w-100">
      <v-progress-circular
        :width="3"
        color="primary"
        indeterminate
        class="mx-auto"
      ></v-progress-circular>
    </div>
  </v-sheet>
</template>

<style scoped>
.myCarousel .v-window__prev,
.myCarousel .v-window__next {
  top: 0;
}

.colorful {
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(to right, #f32170, #ff6b08, #cf23cf, #eedd44);
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
}
</style>
