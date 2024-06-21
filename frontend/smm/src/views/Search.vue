<script setup>
import {useUserStore} from "@/store/users";
import {computed, onMounted, ref, watchEffect} from "vue";
import {baseUrl, fetchWrapper, CHUNK_SIZE} from "@/functions/request";
import SmmCard from "@/components/SmmCard.vue";
import {useDisplay} from 'vuetify';

const {mdAndUp} = useDisplay();
const userStore = useUserStore();
const smmList = ref([]);
const smmToSearch = ref("");
const smmOption = ref("");
const page = ref(1);
const urlToFetch = computed(() => {
  const somethingToSearch = smmToSearch.value !== "" || smmOption.value !== "";
  const queryParams = [];
  if (somethingToSearch) {
    if (smmToSearch.value !== "") {
      queryParams.push("smm=" + encodeURIComponent(smmToSearch.value));
    }
    if (smmOption.value !== "") {
      const sort = smmOption.value.split("-")[0];
      const order = smmOption.value.split("-")[1];
      if (sort && order) {
        queryParams.push("sort=" + encodeURIComponent(sort));
        queryParams.push("order=" + encodeURIComponent(order));
        queryParams.push("page=" + encodeURIComponent(page.value));
      }
    }
  }
  const queryString = queryParams.length > 0 ? "?" + queryParams.join("&") : "";
  return `${baseUrl}/smm${queryString}`;
});
const load = ref(false);
const maxPage = computed(() => {
  return Math.ceil(page.value / CHUNK_SIZE);
});
const refreshContent = async () => {
  if (userStore.currentUser !== null) {
    load.value = true;
    smmList.value = [];
    const res = await fetchWrapper.get(urlToFetch.value);
    if (res && !res.error) {
      page.value = res.count;
      smmList.value = res.page;
    } else {
      page.value = 1;
      smmList.value = [];
    }
    load.value = false;
  }
};
onMounted(async () => {
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
  <v-card class="fill-height" v-if="userStore.currentUser !== null">
    <v-form>

    </v-form>
    <v-container>
      <v-row>
        <v-spacer></v-spacer>
        <v-col :cols="mdAndUp? 6: 12">
          <v-text-field
              rounded
              class="rounded-1"
              density="comfortable"
              theme="light"
              variant="solo"
              placeholder="Search a smm"
              @update:model-value="page = 1"
              v-model="smmToSearch"
              append-inner-icon="mdi-magnify"
          ></v-text-field>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
      <v-row>
        <v-spacer></v-spacer>
        <v-col :cols="mdAndUp? 8: 12">
          <v-radio-group
              v-model="smmOption"
              inline
              @update:model-value="page = 1"
          >
            <template v-slot:prepend>
              <v-icon>mdi-filter-variant</v-icon>&nbsp;Apply filter:
            </template>
            <v-radio value="rating-asc">
              <template v-slot:label>
                <div>rating ascending</div>
              </template>
            </v-radio>
            <v-radio value="rating-desc">
              <template v-slot:label>
                <div>rating descending</div>
              </template>
            </v-radio>
            <v-radio value="cost-asc">
              <template v-slot:label>
                <div>cost asceding</div>
              </template>
            </v-radio>
            <v-radio value="cost-desc">
              <template v-slot:label>
                <div>cost desceding</div>
              </template>
            </v-radio>
          </v-radio-group>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6" v-for="smm in smmList">
          <smm-card :smm="smm" @refresh="refreshContent"></smm-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <div v-if="load" class="d-flex justify-content-center w-100 my-10">
            <v-progress-circular
                :width="3"
                color="primary"
                indeterminate
                class="mx-auto"
            >
            </v-progress-circular>
          </div>
          <v-pagination
              v-if="smmList.length > 0 && !load"
              v-model="page"
              :length="maxPage"
              :total-visible="Math.min(maxPage, 5)"
          ></v-pagination>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<style scoped></style>
