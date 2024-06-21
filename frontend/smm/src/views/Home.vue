<script setup>
import PostCarousel from "@/components/PostCarousel.vue";
import {useUserStore} from "@/store/users";
import {storeToRefs} from "pinia";
import Profile from "@/components/Profile.vue";
import {onMounted} from "vue";
import SmmPreview from "@/components/SmmPreview.vue";

const userStore = useUserStore();
const {currentUser} = storeToRefs(userStore);
onMounted(async () => {
  if (userStore.currentUser === null) {
    try {
      await userStore.LoginAccount();
    } catch (e) {
      await userStore.clearStore();
    }
  }
});
</script>
<template>
  <v-container fluid class="fill-height" v-if="currentUser !== null">
    <v-row>
      <v-spacer></v-spacer>
      <v-col cols="12" lg="6">
        <Profile></Profile>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" lg="5">
        <v-row>
          <v-col cols="12">
            <SmmPreview></SmmPreview>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <PostCarousel></PostCarousel>
          </v-col>
        </v-row>
      </v-col>
      <v-spacer></v-spacer>
    </v-row>
  </v-container>
</template>

<style scoped>
.legend-container {
  padding: 1em;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 14px;
  justify-content: center;
}

.badge {
  border-radius: 4.5px;
  padding: 0;
  width: 9px;
  height: 9px;
  display: inline-block;
  margin-right: 3px;
}

.card-actions {
  position: absolute;
  bottom: 0;
}
</style>
