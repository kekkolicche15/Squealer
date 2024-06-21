<script setup>
import {useUserStore} from "@/store/users";
import {computed, onMounted, ref, watchEffect} from "vue";
import {
  baseUrl,
  emitter,
  fetchWrapper,
  CHUNK_SIZE,
} from "@/functions/request";
import Request from "@/components/Request.vue";
import PostPreview from "@/components/PostPreview.vue";
import Reply from "@/components/Reply.vue";
import Reaction from "@/components/Reaction.vue";
import {useRoute} from "vue-router";
import {useDisplay} from 'vuetify';

const {mdAndUp} = useDisplay();
const userStore = useUserStore();
const route = useRoute();
const option = route.params.option;
const options = ["requests", "posts", "replies", "reactions"];
const tab = ref(option && options.includes(option) ? option : "");
const urlToFetch = computed(() => {
  if (tab.value === "requests")
    return `${baseUrl}/smm/${userStore.currentUser?.username}/waiting-list/?page=${page.value}`;
  if (tab.value === "posts")
    return `${userStore.postUrl}/?author=${userStore.currentUser?.username}&page=${page.value}&type=channel`;
  if (tab.value === "replies")
    return `${userStore.postUrl}/?type=replies&parent=true&page=${page.value}`;
  return `${userStore.postUrl}/reactions/?page=${page.value}`;
});
const listToRender = ref([]);
const page = ref(1);
const load = ref(false);
const nDocs = ref(0);
const maxPage = computed(() => {
  return Math.ceil(nDocs.value / CHUNK_SIZE);
});

const changeTab = async () => {
  page.value = 1;
  nDocs.value = 0;
  await refreshContent();
};
const refreshContent = async () => {
  if (userStore.currentUser !== null) {
    load.value = true;
    listToRender.value = [];
    const data = await fetchWrapper.get(urlToFetch.value);
    load.value = false;
    if (data.error) {
      listToRender.value = [];
      nDocs.value = 0;
    } else {
      listToRender.value = data.page;
      nDocs.value = data.count;
    }
  }
};

onMounted(async () => {
  emitter.on("refresh", async () => refreshContent());
  if (userStore.currentUser === null) {
    try {
      await userStore.LoginAccount();
    } catch (e) {
      await userStore.clearStore();
    }
  }
  watchEffect(refreshContent);
});
</script>
<template>
  <v-card
      class="fill-height"
      :class="{'px-16': mdAndUp}"
      v-if="userStore.currentUser !== null"
      role="region"
      aria-label="Notifications section"
  >
    <v-container>
      <v-card-title class="text-center justify-center py-6">
        <h1 :class="{'text-h2': mdAndUp, 'text-h6': !mdAndUp}" class="font-weight-bold text-basil">Notifications</h1>
      </v-card-title>
      <v-tabs
          v-model="tab"
          bg-color="transparent"
          color="basil"
          grow
          aria-label="Notification tabs"
      >
        <v-tab
            v-for="option in options"
            :key="option"
            :value="option"
            @click="changeTab"
            role="tab"
            :class="{'text-body-1': !mdAndUp}"
            :aria-controls="`tab-${option}`"
            :aria-selected="tab === option"
            :disabled="load"
        >
          {{ option }}
        </v-tab>
      </v-tabs>

      <v-window v-model="tab" role="tabpanel">
        <v-window-item
            v-for="option in options"
            :key="option"
            :value="option"
            :id="`tab-${option}`"
            role="tabpanel"
            aria-labelledby="tab"
        >
          <v-container color="basil" fill-height>
            <v-row>
              <v-col cols="12" v-for="render in listToRender" :key="render.id">
                <request
                    :user="render"
                    @update-notification="refreshContent"
                    v-if="tab === 'requests'"
                ></request>
                <post-preview
                    :post="render"
                    :username="render.author"
                    :width="'100%'"
                    v-if="tab === 'posts'"
                    :height="'auto'"
                    :icon="true"
                ></post-preview>
                <reply :post="render" v-if="tab === 'replies'"></reply>
                <reaction
                    :reaction="render"
                    v-if="tab === 'reactions'"
                ></reaction>
              </v-col>
              <v-col>
                <div
                    v-if="load"
                    class="d-flex justify-content-center w-100 my-10"
                >
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
          </v-container>
        </v-window-item>
      </v-window>
    </v-container>
  </v-card>
</template>
<style scoped></style>
