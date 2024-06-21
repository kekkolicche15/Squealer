<script setup>
import {baseUrl, emitter, fetchWrapper} from "@/functions/request";
import {useUserStore} from "@/store/users";
import {ref} from "vue";
import {useRegexStore} from "@/store/regex";
import Quota from "@/components/Quota.vue";
import {useDisplay} from 'vuetify';

const {mdAndUp} = useDisplay();
const regexStore = useRegexStore();
const userStore = useUserStore();
const openEdit = ref(false);
const oldVisible = ref(false);
const newVisible = ref(false);
const username = ref(userStore.currentUser.username);
const oldps = ref("");
const newps = ref("");
const picture = ref(null);

const edit = async () => {
  const body = new FormData();
  if (!regexStore.regexes.username.test(username.value))
    emitter.emit("snack", {
      msg: "Username non valido",
      color: "red-accent-1",
    });
  if (!regexStore.regexes.password.test(newps.value))
    emitter.emit("snack", {
      msg: "Password nuovo non valido",
      color: "red-accent-1",
    });
  if (!regexStore.regexes.password.test(oldps.value))
    emitter.emit("snack", {
      msg: "Password vecchio non valido",
      color: "red-accent-1",
    });
  if (username.value !== userStore.currentUser.username)
    body.append("username", username.value);
  if (newps.value !== "") body.append("password", oldps.value);
  if (oldps.value !== "") body.append("currentPassword", oldps.value);
  if (!body.entries().next().done) {
    await fetchWrapper.patch(
        `${baseUrl}/user/edit`,
      body,
      "application/json",
      true,
      "Impostazioni cambiate con successo",
    );
    openEdit.value = false;
    await userStore.updateData();
    oldps.value = "";
    newps.value = "";
    username.value = "";
  }
  const pictureBody = new FormData();
  if (picture.value && picture.value[0]) {
    pictureBody.append("image", picture.value[0]);
    await fetchWrapper.patch(
        `${baseUrl}/user/edit/pic`,
      pictureBody,
      "multipart/form-data",
      true,
      "Impostazioni cambiate con successo",
    );
    await userStore.updateData();
    picture.value = null;
  }
};

const ceaseSMM = async () => {
  await fetchWrapper.delete(
      `${baseUrl}/smm/`,
    true,
    "Smm cancellato con successo",
  );
  await userStore.updateData();
};

const openSMM = ref(false);
const maxVips = ref(1);
const cost = ref(1);
const smmDescription = ref("");
const isDigit = (str) => {
  return /^\d+$/.test(str); // Verifica se la stringa contiene solo cifre
};
const openQuota = ref(false);
const becomeSmm = async () => {
  const body = {};
  if (
    isDigit(cost.value) &&
    cost.value > 0 &&
    isDigit(maxVips.value) &&
    maxVips.value > 0 &&
    smmDescription.value.length > 0
  ) {
    body["cost"] = cost.value;
    body["maxVipCount"] = maxVips.value;
    body["description"] = smmDescription.value;
    //TODO controlla che lo score sia sufficiente
    await fetchWrapper.post(
        `${baseUrl}/smm/`,
      body,
      "application/json",
      true,
      "Sei diventato SMM",
    );
    await userStore.updateData();
    openSMM.value = false;
  } else {
    emitter.emit("snack", {msg: "Formato non valido", color: "red-accent-1"});
  }
};
const quitSmm = async () => {
  await fetchWrapper.delete(`${baseUrl}/smm/manager/`, false, {
    msg: "Smm quittato con successo",
    color: "green-accent-1",
  });
  await userStore.updateData();
};
</script>

<template>
  <v-dialog v-model="openQuota" width="80vw" height="60vh">
    <Quota :min-quota-to-buy="0" @close-quota="openQuota = false"></Quota>
  </v-dialog>
  <v-card
      class="rounded-xl elevation-10 d-flex flex-column"
    color="#fff"
      max-width="100%"
    height="100%"
    :title="userStore.currentUser.username"
    v-if="userStore.currentUser !== null"
  >
    <template v-slot:subtitle class="emoji">
      {{ userStore.currentUser.role }}
      {{ userStore.currentUser.role === "vip" ? "🎩" : "👑" }}
    </template>
    <template v-slot:title>
      {{ userStore.currentUser.username }}
    </template>
    <template v-slot:prepend>
      <v-avatar
        class="mx-auto my-5"
        color="grey-darken-3"
        size="3rem"
        :image="`${baseUrl}/user/${userStore.currentUser.username}/picture`"
      >
      </v-avatar>
    </template>
    <template v-slot:append>
      <v-btn
        class="rounded-xl"
        prepend-icon="mdi-close"
        color="red-accent-2"
        v-if="userStore.currentUser.role === 'smm'"
        @click="ceaseSMM"
      >cease SMM
      </v-btn>
      <div class="d-flex flex-column" v-else>
        <v-btn
          class="rounded-xl my-5"
          prepend-icon="mdi-account-check-outline"
          color="green-accent-2"
          @click="openSMM = !openSMM"
        >become Smm
        </v-btn>
        <v-btn
          class="rounded-xl"
          prepend-icon="mdi-account-search"
          color="info"
          :to="{ name: 'Search' }"
        >Search Smm
        </v-btn>
      </div>
    </template>
    <v-card-text class="adjustline text-body-1">
      <div>
        <span class="emoji">📝</span> Description:
        {{ userStore.currentUser.bio }}
      </div>
      <div>
        <span class="emoji">✉️</span> Email: {{ userStore.currentUser.email }}
      </div>
      <div>
        <span class="emoji">💰</span> Score:
        {{
          userStore.currentUser.score > 999999
              ? "999999+"
              : userStore.currentUser.score
        }}
      </div>
      <div>
        <span class="emoji">🗓️</span> Quote:
        {{ userStore.currentUser.quotas.values[0] }}
        {{ userStore.currentUser.quotas.values[1] }}
        {{ userStore.currentUser.quotas.values[2] }}
      </div>
      <div
          v-if="
          userStore.originalUser.role === 'smm' &&
          userStore.sameUser &&
          userStore.smmInfo !== null
        "
      >
        <span class="emoji">💵</span> Cost per month:
        {{ userStore.smmInfo.cost }}
      </div>
      <div
          v-if="
          userStore.originalUser.role === 'smm' &&
          userStore.sameUser &&
          userStore.smmInfo !== null
        "
      >
        <span class="emoji">🧑‍💼</span> Managing vips:
        {{ userStore.smmInfo.currentVipCount }}/{{
          userStore.smmInfo.maxVipCount
        }}
      </div>
      <div
          v-if="
          userStore.originalUser.role === 'smm' &&
          userStore.sameUser &&
          userStore.smmInfo !== null
        "
      >
        <span class="emoji">⭐</span> Rating: {{ userStore.smmInfo.rating }}
      </div>
      <div v-if="userStore.currentUser.role !== 'smm'">
        <div v-if="userStore.managerInfo !== null">
          Your Social media manager:
          <v-chip
              :prepend-avatar="`${baseUrl}/user/${userStore.managerInfo.smm.username}/picture`"
          >
            {{ userStore.managerInfo.smm.username }}
          </v-chip>
          &nbsp;&nbsp;&nbsp;
          <v-btn
              prepend-icon="mdi-close"
              color="red"
              compact
              rounded
              size="small"
              @click="quitSmm"
          >quit
          </v-btn>
        </div>
      </div>
    </v-card-text>
    <v-spacer></v-spacer>
    <v-card-actions class="w-100 d-flex justify-space-around card-actions">
      <v-btn
          class="bg-primary rounded-xl"
          :to="{ name: 'Notification', params: { option: 'posts' } }"
      >view posts
      </v-btn>
      <v-btn
          class="bg-primary rounded-xl"
          :to="{ name: 'Notification', params: { option: 'replies' } }"
      >view replies
      </v-btn>
      <v-btn
          class="bg-primary rounded-xl"
          v-if="mdAndUp"
          :to="{ name: 'Notification', params: { option: 'reactions' } }"
      >View reactions
      </v-btn>
    </v-card-actions>
    <v-card-actions v-if="!mdAndUp" class="w-100 d-flex justify-space-around card-actions">
      <v-btn
          class="bg-primary rounded-xl"
          :to="{ name: 'Notification', params: { option: 'reactions' } }"
      >View reactions
      </v-btn>
    </v-card-actions>
    <v-card-actions
        class="w-100 d-flex justify-space-around card-actions mb-10"
    >
      <v-btn
          class="bg-primary rounded-xl"
          v-if="userStore.sameUser"
          @click="openEdit = true"
      >edit info
      </v-btn>
      <v-btn class="bg-primary rounded-xl" @click="openQuota = !openQuota"
      >Buy quota
      </v-btn>
    </v-card-actions>
    <v-dialog v-model="openEdit" width="80vw" height="60vh">
      <v-card class="rounded-xl">
        <v-form @submit.prevent="edit">
          <v-card-title>
            <span class="text-h5">User Profile</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                      label="Username"
                      variant="underlined"
                      v-model="username"
                      class="my-7"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-file-input
                      variant="underlined"
                      accept="image/*"
                      label="Icon"
                      v-model="picture"
                  >
                  </v-file-input>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                      label="Old password"
                      variant="underlined"
                      required
                      v-model="oldps"
                      :append-inner-icon="oldVisible ? 'mdi-eye-off' : 'mdi-eye'"
                      :type="oldVisible ? 'text' : 'password'"
                      prepend-inner-icon="mdi-lock-outline"
                      @click:append-inner="oldVisible = !oldVisible"
                      placeholder="Enter your old password"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                      label="New password"
                      variant="underlined"
                      required
                      :append-inner-icon="newVisible ? 'mdi-eye-off' : 'mdi-eye'"
                      :type="newVisible ? 'text' : 'password'"
                      prepend-inner-icon="mdi-lock-outline"
                      @click:append-inner="newVisible = !newVisible"
                      v-model="newps"
                      placeholder="Enter your new password"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea variant="underlined" label="Insert new bio">
                  </v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="w-100 d-flex justify-space-around card-actions">
            <v-btn color="blue-darken-1" variant="text" @click="openEdit = false">
              Close
            </v-btn>
            <v-btn type="submit" color="blue-darken-1" variant="text">
              Save
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
    <v-dialog v-model="openSMM" width="80vw" height="60vh">
      <v-card class="rounded-xl">
        <v-card-title>
          <span class="text-h5">User Profile</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="Cost"
                  variant="underlined"
                  required
                  v-model="cost"
                  type="number"
                  min="1"
                  placeholder="Insert monthly cost"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="maxVipCount"
                  variant="underlined"
                  required
                  v-model="maxVips"
                  type="number"
                  min="1"
                  placeholder="Insert maxVipCount"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  variant="underlined"
                  label="Insert new description"
                  v-model="smmDescription"
                >
                </v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="w-100 d-flex justify-space-around card-actions">
          <v-btn color="blue-darken-1" variant="text" @click="openSMM = false">
            Close
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="becomeSmm">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
@import url(https://fonts.googleapis.com/css2?family=Noto+Color+Emoji);

.emoji {
  font-family: "Noto Color Emoji", sans-serif;
}

.adjustline {
  line-height: 1.5em;
}
</style>
