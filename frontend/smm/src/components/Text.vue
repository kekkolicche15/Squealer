<script setup xmlns:v-slot="http://www.w3.org/1999/html">
import {computed, onMounted, ref} from "vue";
import Map from "@/components/Map.vue";
import {useUserStore} from "@/store/users";
import {storeToRefs} from "pinia";
import {
  baseUrl,
  emitter,
  fetchWrapper,
  sendTimedPosts,
} from "@/functions/request";
import {useRegexStore} from "@/store/regex";
import WebCam from "@/components/WebCam.vue";
import Quota from "@/components/Quota.vue";
import {imageCost, videoCost} from "@/consts/const";
import {useDisplay} from 'vuetify';

const {mdAndUp} = useDisplay();
const randomImageUrl = `https://api.unsplash.com/photos/random/?client_id=${
    import.meta.env.VITE_RANDOM_IMAGE
}`;
const chips = ref([]);
const destination = ref("");
const channels = ref([]);
const userStore = useUserStore();
const {currentUser} = storeToRefs(userStore);
const regexStore = useRegexStore();
const message = ref("");
const dialog = ref(false);
const mapDialog = ref(false);
const fileRef = ref(null);
const counterActive = ref(false);
const renderImage = ref(false);
const renderVideo = ref(false);
const sourceImage = ref("");
const sourceVideo = ref("");
const fileToSend = ref(null);
const player = ref(null);
const location = ref("");
const wikipediaUrl = "https://en.wikipedia.org/api/rest_v1/page/random/summary";
const openQuota = ref(false);
const remove = (item) => {
  const index = chips.value.indexOf(item);
  if (index !== -1) {
    chips.value.splice(index, 1);
  }
};
const addNewChip = () => {
  chips.value = [...new Set([...chips.value, destination.value])];
  destination.value = "";
};

const disableChip = computed(() => {
  return !destination?.value || !destination?.value.trim();
});
const minQuotaToBuy = ref(0);
const quotaToBuy = ref("");
const nTimes = ref("1");
const interval = ref("1000");
const timer = ref(null);
const timerChecked = ref(false);
const sendMessage = async () => {
  const upload = new FormData();
  if (fileToSend.value) upload.append("attachment", fileToSend.value[0]);
  if (chips.value.length > 0) upload.append("channels", chips.value);
  if (message.value.length !== 0) upload.append("content", message.value);
  if (location.value.length !== 0) upload.append("location", location.value);
  const cost =
      ((renderVideo.value ? videoCost : renderImage.value ? imageCost : 0) +
          message.value.length) *
      timerChecked.value
          ? parseInt(nTimes.value)
          : 1;
  if (cost > Math.min(...currentUser.value.quotas.values)) {
    minQuotaToBuy.value =
        (cost - Math.min(...currentUser.value.quotas.values) + 200) *
        (userStore.sameUser ? 5 : 10) *
        timerChecked.value
            ? parseInt(nTimes.value)
            : 1;
    quotaToBuy.value = String(minQuotaToBuy.value);
    openQuota.value = true;
  } else if (timerChecked.value && setTimer.value) {
    await sendTimedPosts(
        fileToSend.value,
        message.value,
        geoLocationChecked.value,
        userStore.postUrl,
        parseInt(nTimes.value),
        parseInt(interval.value),
        chips.value,
    );
    await userStore.updateData();
    clearMessage();
    clearRender();
  } else {
    const data = await fetchWrapper.post(
        userStore.postUrl,
        upload,
        "multipart/form-data",
        true,
        "Post inviato con successo",
    );
    await userStore.updateData();
    clearMessage();
    clearChannels();
    clearRender();
  }
};
const isDigit = (str) => {
  return /^\d+$/.test(str); // Verifica se la stringa contiene solo cifre
};
const checkValidTimes = () => {
  if (!isDigit(nTimes.value) || !(parseInt(nTimes.value) >= 1)) {
    nTimes.value = "1";
  }
};
const checkValidInterval = () => {
  if (!isDigit(interval.value) || !(parseInt(interval.value) >= 1000)) {
    interval.value = "1000";
  }
};
const setTimer = ref(false);
const geoLocationChecked = ref(false);

const openGeolocation = () => {
  if (fileToSend.value) {
    emitter.emit("snack", {
      msg: "Elimina il file per generare le immagini delle geolocalizzazioni",
      color: "red-accent-1",
    });
  }
};

const clearMessage = () => {
  message.value = "";
};
const clearChannels = () => {
  chips.value = [];
};

const clearRender = () => {
  renderVideo.value = false;
  renderImage.value = false;
  fileToSend.value = null;
  sourceVideo.value = "";
  sourceImage.value = "";
};

const messageRules = ref([
  (v) =>
      v.length < Math.min(...currentUser.value.quotas.values) ||
      "you have exceeded your quota",
]);

const isDisabled = computed(() => {
  return (!message.value && !fileRef?.value?.files) || (chips.value.length === 0 && location.value.length === 0);
});
const searchChannel = async (val) => {
  const data = await fetchWrapper.get(`${baseUrl}/channel/?name=${encodeURIComponent(val)}`);
  channels.value = data.page.map(({name}) => name);
  if (val.startsWith("#") && regexStore.regexes["channel"].test(val.split("#")[1]))
    channels.value = [val, ...channels.value]
};

const uploadOptions = ref([
  {
    title: "Access from camera",
    icon: "mdi-camera",
    action() {
      dialog.value = true;
      mapDialog.value = false;
    },
  },
  {
    title: "Select from gallery",
    icon: "mdi-multimedia",
    action() {
      fileRef.value.click();
      renderMime();
    },
  },
  {
    title: "Get random image",
    icon: "mdi-image",
    async action() {
      const res = await fetch(randomImageUrl);
      const data = await res.json();
      const regular = await fetch(data.urls.regular);
      const image = await regular.blob();
      const blob = new Blob([image], {type: "image/png"});
      const file = new File([blob], "random.png", {type: "image/png"});
      renderMime([file]);
    },
  },
  {
    title: "Add your position",
    icon: "mdi-map-marker",
    action() {
      dialog.value = true;
      mapDialog.value = true;
    },
  },
  {
    title: "Get wiki",
    icon: "mdi-lightbulb-on-outline",
    async action() {
      const data = await fetchWrapper.get(wikipediaUrl);
      message.value = `Did you know that ${data.extract}`;
    },
  },
  {
    title: "Temporized",
    icon: "mdi-timer-marker-outline",
    async action() {
      setTimer.value = !setTimer.value;
    },
  },
]);

const videoType = ref("");
const convertLinks = async (e) => {
  const regex = new RegExp(
      "\\b(https?:\\/\\/(?!bit\\.ly|t\\.co|is\\.gd)[^\\s]+)\\b",
  );
  const longLinks = message.value
      .split(" ")
      .map((w, index) =>
          regex.test(w)
              ? {
                link: w,
                index: index,
              }
              : null,
      )
      .filter((w) => w !== null);
  const shortLinks = (
      await Promise.all(
          longLinks.map((link) =>
              fetchWrapper.get(
                  `https://is.gd/create.php?format=json&url=${encodeURIComponent(
                      link.link,
                  )}`,
              ),
          ),
      )
  ).map(({shorturl}) => shorturl);
  message.value = message.value
      .split(" ")
      .map((w, index) => {
        const idx = longLinks.findIndex((longLink) => longLink.index === index);
        return idx === -1 ? w : shortLinks[idx];
      })
      .join(" ");
};

const handleUpload = (index) => {
  uploadOptions.value[index].action.call(this);
};

const renderMime = (fileToRender = null) => {
  if (fileToRender) fileToSend.value = fileToRender;
  else fileToSend.value = fileRef.value.files[0];
  if (fileToSend.value) {
    const file = fileToSend.value[0];
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const buffer = new Uint8Array(e.target.result);
      const uintArray = new Uint8Array(e.target.result).subarray(0, 4);
      const ftypBox = String.fromCharCode.apply(null, buffer.slice(4, 8)); // Check the "ftyp" box
      let header = "";
      for (let i = 0; i < uintArray.length; i++) {
        header += uintArray[i].toString(16);
      }
      renderImage.value = false;
      renderVideo.value = false;
      sourceImage.value = "";
      sourceVideo.value = "";
      const imageMime = ["89504e47", "ffd8ffe0", "ffd8ffe1", "ffd8ffe2"];
      if (ftypBox === "ftyp") {
        renderVideo.value = true;
        sourceVideo.value = URL.createObjectURL(file);
        videoType.value = file.type;
      } else if (imageMime.includes(header)) {
        renderImage.value = true;
        sourceImage.value = URL.createObjectURL(file);
      }
    };
    reader.readAsArrayBuffer(file);
  }
};

const closeDialog = (fileToRender, loc) => {
  dialog.value = false;
  location.value = loc ?? "";
  renderMime(fileToRender);
};

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
  <v-card class="mx-auto py-6 bg-white rounded-xl" v-if="currentUser !== null"
          :style="{height: mdAndUp ? '50vh' : '100vh', width: mdAndUp ? '80vw' : '100vw'}"
  >
    <v-container>
      <v-file-input
          accept="image/*, video/*"
          label="Upload your photo/image"
          density="compact"
          variant="solo"
          ref="fileRef"
          class="d-none"
          @update:model-value="renderMime"
          aria-describedby="file-upload-description"
      >
      </v-file-input>
      <div class="pt-6 mx-auto" :class="{'px-6': mdAndUp}">Destination:</div>
      <v-row align="center" class="pa-6 mx-auto">
        <v-chip-group role="list" aria-label="Selected destinations">
          <v-chip
              class="ma-1"
              closable
              v-for="(chip, index) in chips"
              :key="index"
              @click:close="remove(chip)"
              :prepend-avatar="`${baseUrl}/channel/${encodeURIComponent(chip)}/picture/preview`"
              role="listitem"
              aria-label="Destination chip"
          >
            {{ decodeURIComponent(chip) }}
          </v-chip>
        </v-chip-group>
      </v-row>
      <v-row align="center" class="mx-auto" :class="{'px-6': mdAndUp}">
        <v-autocomplete
            :items="channels"
            class="rounded-1"
            density="comfortable"
            menu-icon=""
            theme="light"
            variant="solo"
            auto-select-first
            placeholder="add a new destination"
            @update:search="searchChannel"
            v-model="destination"
            label="Add a new destination"
            aria-label="Add a new destination"
        >
          <template v-slot:prepend>
            <span> To: </span>
          </template>
          <template v-slot:append>
            <v-btn
                @click="addNewChip"
                icon="mdi-plus-circle"
                variant="plain"
                density="compact"
                :disabled="disableChip"
                aria-label="Add destination"
            >
            </v-btn>
          </template>
        </v-autocomplete>
      </v-row>
      <v-row align="center" class="pt-6 mx-auto" :class="{'px-6': mdAndUp}">
        <v-textarea
            label="Post"
            single-line
            variant="solo"
            clearable
            @click:append="sendMessage"
            @click:clear="clearMessage"
            @focus="counterActive = true"
            @blur="counterActive = false"
            @keyup.native.enter="convertLinks"
            @keyup.native.space="convertLinks"
            no-resize
            rows="10"
            row-height="30"
            v-model="message"
            :rules="messageRules"
            aria-label="Write your post"
        >
          <template v-slot:prepend>
            <v-menu close-on-content-click>
              <template v-slot:activator="{ props }">
                <v-btn
                    icon="mdi-paperclip"
                    variant="plain"
                    density="compact"
                    v-bind="props"
                    aria-label="Attachment options"
                >
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                    v-for="(item, index) in uploadOptions"
                    :key="index"
                    :value="index"
                    :prepend-icon="item.icon"
                    @click="handleUpload(index)"
                    role="menuitem"
                    aria-label="Upload option"
                >
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <template v-slot:append>
            <v-btn
                icon="mdi-send"
                @click="sendMessage"
                variant="plain"
                density="compact"
                :disabled="isDisabled"
                aria-label="Send post"
            >
            </v-btn>
          </template>
          <template v-slot:details>
            <div
                class="d-flex justify-space-between ml-auto flex-1-1 text-medium-emphasis text-shades-white flex-wrap"
            >
              <v-counter :active="counterActive">
                &nbsp;Daily:{{
                  currentUser["quotas"]["values"][0] - message.length
                }}
              </v-counter>
              <v-counter :active="counterActive">
                &nbsp;Weekly:{{
                  currentUser["quotas"]["values"][1] - message.length
                }}
              </v-counter>
              <v-counter :active="counterActive">
                &nbsp;Monthly:{{
                  currentUser["quotas"]["values"][2] - message.length
                }}
              </v-counter>
            </div>
          </template>
        </v-textarea>
      </v-row>
      <v-row
          class="justify-space-around px-16"
          v-show="renderImage || renderVideo"
      >
        <div class="relative mx-auto">
          <v-btn
              class="top-right"
              icon="mdi-close"
              color="red-darken-3"
              size="x-small"
              @click="clearRender"
              aria-label="Clear uploaded media"
          ></v-btn>
          <img
              class="bordered rounded-lg elevation-2"
              v-show="renderImage"
              :src="sourceImage"
              alt="Uploaded image preview"
          />
          <video
              ref="player"
              v-show="renderVideo"
              controls
              type="video/mp4"
              :key="sourceVideo"
              aria-label="Uploaded video preview"
          >
            <source :src="sourceVideo" :type="videoType"/>
          </video>
        </div>
      </v-row>
      <v-row v-if="setTimer" class="px-16">
        <v-col cols="6">
          <v-checkbox
              v-model="timerChecked"
              label="Set timer"
              aria-label="Enable timer"
          ></v-checkbox>
        </v-col>
        <v-col cols="6">
          <v-checkbox
              v-model="geoLocationChecked"
              label="Set Geolocation"
              @update:modelValue="openGeolocation"
              aria-label="Enable geolocation"
          ></v-checkbox>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :disabled="!timerChecked"
              label="Times"
              v-model="nTimes"
              type="number"
              @keyup="checkValidTimes"
              min="1"
              prepend-inner-icon="mdi-timer-outline"
              aria-label="Set number of times"
          >
          </v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              :disabled="!timerChecked"
              label="Interval"
              v-model="interval"
              type="number"
              min="1000"
              @keyup="checkValidInterval"
              prepend-inner-icon="mdi-timer-sand"
              aria-label="Set interval in milliseconds"
          >
          </v-text-field>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
  <v-dialog v-model="dialog" fullscreen aria-label="Map or Webcam dialog">
    <v-card class="p-5">
      <Map v-if="mapDialog" @close="closeDialog" aria-label="Map view"></Map>
      <WebCam v-else @close="closeDialog" aria-label="Webcam view"></WebCam>
    </v-card>
  </v-dialog>
  <v-dialog
      v-model="openQuota"
      width="80vw"
      height="60vh"
      aria-label="Quota dialog"
  >
    <Quota
        :min-quota-to-buy="minQuotaToBuy"
        @close-quota="openQuota = false"
        aria-label="Quota management"
    ></Quota>
  </v-dialog>
</template>
<style scoped>
.bordered {
  border: white 5px solid;
}

img {
  max-width: 100%;
}

video {
  max-width: 100%;
}

.relative {
  position: relative;
  flex-grow: 0;
}

.top-right {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
