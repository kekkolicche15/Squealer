<script setup>
import {computed, onMounted, ref, toRaw, watch} from "vue";
import {useInfiniteScroll} from "@vueuse/core";
import {baseUrl, fetchWrapper, emitter} from "@/functions/request";
import {useUserStore} from "@/store/users";
import {storeToRefs} from "pinia";
import router from "@/router";
const page = ref(1);
const fetchingData = ref(false);
const usersList = ref([]);
let end = false;
const getUsersOnScroll = async () => {
  const newUsers = await fetchWrapper.get(
      `${baseUrl}/smm/managed-vips/?page=${page.value++}`,
  );
  if (newUsers.error) {
    end = true;
  } else usersList.value = [...new Set([...usersList.value, ...newUsers])];
  fetchingData.value = false;
};
const el = ref(null);
const clearData = () => {
  usersList.value = [];
  fetchingData.value = false;
  page.value = 1;
  end = false;
};
onMounted(async () => {
  emitter.on("add-vip", clearData);
  useInfiniteScroll(
    el,
    async () => {
      if (!end) await getUsersOnScroll();
    },
      {distance: 10},
  );
  watch(
    currentUser,
    (newVal, oldVal) => {
      selectedUser.value = toRaw(newVal);
    },
      {deep: true},
  );
});
const userStore = useUserStore();
const {currentUser} = storeToRefs(userStore);
const selectedUser = ref("");
const filteredList = computed(() => {
  return usersList.value.filter((user) => user.username !== selectedUser.value);
});
const changeAccount = async (username) => {
  await userStore.changeAccount(username);
  selectedUser.value = username;
  await router.push("/");
};
</script>

<template>
  <div style="flex: 1; overflow-y: auto" ref="el">
    <v-list class="d-flex flex-column justify-center" v-if="filteredList.length !== 0">
      <div v-for="user in filteredList">
        <v-list-item
          lines="two"
          :prepend-avatar="`${baseUrl}/user/${user?.username}/picture`"
          :title="`${user?.username}`"
          subtitle="Switch account"
          class="text-capitalize"
          append-icon="mdi-swap-horizontal"
          @click="changeAccount(user.username)"
        >
        </v-list-item>
        <v-divider></v-divider>
      </div>
      <v-progress-circular
        :width="3"
        color="primary"
        indeterminate
        v-if="fetchingData"
      ></v-progress-circular>
    </v-list>
  </div>
</template>

<style scoped></style>
