<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import VirtualList from "@/components/IconVirtualList.vue";
import {useUserStore} from "@/store/users";
import {baseUrl, emitter, fetchWrapper} from "@/functions/request";
import router from "@/router";

const route = useRoute();
const drawer = ref(false);
const userDrawer = ref(false);
const loading = ref(false);

const menuItems = [
  {
    to: {name: "Home"},
    icon: "mdi-home-variant",
  },
  {
    to: {name: "Search"},
    icon: "mdi-account",
  },
  {
    to: {name: "Notification", params: {option: "requests"}},
    icon: "mdi-email-outline",
  },
];
const accountStore = useUserStore();
const items = ref([]);
const badgeOn = ref(false);
onMounted(() => {
  watch(route, (to, from) => {
    drawer.value = false;
    userDrawer.value = false;
  });
});
const notificationOn = async () => {
  if (accountStore.currentUser.role === "smm") {
    const data = await fetchWrapper.get(
        `${baseUrl}/smm/${accountStore.currentUser.username}/waiting-list/?page=1`,
    );
    if (!(data instanceof Response)) {
      if (data.length > 0) {
        badgeOn.value = true;
      }
      badgeOn.value = false;
    }
    badgeOn.value = false;
  }
};
const logInfo = computed(() => {
  if (accountStore.currentUser === null) return {string: "Loading", icon: ""};
  return accountStore.currentUser.username ===
  accountStore.originalUser.username
      ? {string: "Logged in", icon: ""}
      : {string: "restore back", icon: "mdi-restore"};
});
const loggedIn = computed(() => {
  return accountStore.currentUser !== null;
});
const logout = async () => {
  await accountStore.logout();
  await router.push({path: "/login"});
};
const openWriteDialog = () => {
  emitter.emit("write");
};
onMounted(async () => {
  if (accountStore.currentUser === null)
    try {
      await accountStore.LoginAccount();
    } catch (e) {
      await accountStore.clearStore();
    }
  await notificationOn();
  emitter.on("update-badge", async () => {
    await notificationOn();
  });
});
</script>

<template>
  <v-app-bar id="nav" v-if="accountStore.currentUser !== null">
    <v-app-bar-nav-icon
        @click="drawer = !drawer"
        class="d-flex"
        role="button"
        aria-label="Toggle navigation menu"
        tabindex="0"
    ></v-app-bar-nav-icon>
    <v-app-bar-title>Squealer</v-app-bar-title>
    <v-spacer></v-spacer>
    <v-btn
        icon
        v-if="badgeOn"
        :to="{ name: 'Notification', params: { option: 'requests' } }"
        aria-label="View notifications"
    >
      <v-badge dot color="red">
        <v-icon color="yellow" aria-hidden="true">mdi-bell</v-icon>
      </v-badge>
    </v-btn>
    <v-btn
        icon
        :to="{ name: 'Notification', params: { option: 'requests' } }"
        aria-label="View notifications"
        v-else
    >
      <v-icon color="yellow" aria-hidden="true">mdi-bell</v-icon>
    </v-btn>
    <v-btn icon @click="logout" aria-label="Logout">
      <v-icon>mdi-exit-to-app</v-icon>
    </v-btn>
    <v-btn
        v-if="loggedIn"
        icon
        @click="userDrawer = !userDrawer"
        aria-label="User settings"
    >
      <v-icon>mdi-dots-vertical</v-icon>
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" temporary class="d-flex">
    <v-list dense nav>
      <v-list-item
          v-for="menuItem in menuItems"
          :key="menuItem.to.name"
          :prepend-icon="menuItem.icon"
          :to="menuItem.to"
          :title="menuItem.to.name"
          role="menuitem"
          :tabindex="drawer ? '0' : '-1'"
      >
      </v-list-item>
      <v-list-item
          prepend-icon="mdi-text-box-edit-outline"
          role="menuitem"
          title="Write something"
          :tabindex="drawer ? '0' : '-1'"
          @click="openWriteDialog"
      >
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-navigation-drawer
      temporary
      location="right"
      v-model="userDrawer"
      class="d-flex flex-column"
      aria-label="User profile settings"
  >
    <template v-slot:prepend>
      <v-list-item
          lines="two"
          :prepend-avatar="`${baseUrl}/user/${accountStore.currentUser?.username}/picture`"
          :title="accountStore.currentUser?.username"
          :subtitle="logInfo.string"
          :append-icon="logInfo.icon"
          @click="accountStore.restoreAccount"
          role="menuitem"
          tabindex="0"
      ></v-list-item>
    </template>
    <v-divider></v-divider>
    <div style="display: flex; flex-direction: column; height: 100%">
      <suspense>
        <VirtualList></VirtualList>
        <template #fallback>is Loading...</template>
      </suspense>
    </div>
  </v-navigation-drawer>
</template>

<style scoped></style>
