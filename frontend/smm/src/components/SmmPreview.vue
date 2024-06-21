<script setup>
import {useUserStore} from "@/store/users";
import SmmCard from "@/components/SmmCard.vue";
const userStore = useUserStore();
</script>

<template>
  <v-sheet v-if="userStore.smmInfo || userStore.managerInfo">
    <div
        class="text-center text-capitalize text-h4 my-3 colorful font-weight-bold"
    >
      Check SMM status
    </div>
    <smm-card
        :smm="userStore.smmInfo ?? userStore.managerInfo"
        @refresh="userStore.updateData"
    >
    </smm-card>
  </v-sheet>
</template>

<style scoped>
.colorful {
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(to right, #f32170, #ff6b08, #cf23cf, #eedd44);
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
}
</style>
