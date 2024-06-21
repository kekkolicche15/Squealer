<template>
  <div class="relative full-screen">
    <v-btn class="top-left" @click="close" aria-label="Close camera">
      close
    </v-btn>
    <v-btn class="top-right" @click="send" aria-label="Send photo"> send</v-btn>
    <v-row class="justify-space-around d-flex align-center h-screen">
      <div v-show="cameraOpen && isLoading" class="camera-loading">
        <v-progress-circular
            :width="3"
            color="green"
            indeterminate
            aria-label="Loading camera"
        ></v-progress-circular>
      </div>
      <div v-if="cameraOpen" v-show="!isLoading">
        <div class="relative">
          <video
              ref="cameraRef"
              class="bordered rounded-lg elevation-2"
              @canplay="cameraSetup"
              aria-label="Camera feed"
          ></video>
          <v-btn
              type="button"
              class="bottom-center"
              @click="takePhoto"
              icon="mdi-camera"
              aria-label="Take photo"
          >
          </v-btn>
          <img
              ref="photoRef"
              class="bottom-left bordered rounded-lg elevation-2"
              v-show="isPhotoTaken"
              :src="imageSrc"
              alt="Captured photo"
          />
        </div>
        <div class="d-none">
          <canvas ref="canvasRef"></canvas>
        </div>
      </div>
    </v-row>
  </div>
</template>
<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";

const emits = defineEmits(["close"]);
const file = ref(null);
const send = () => {
  if (file.value !== null) emits("close", [file.value]);
};

const close = () => {
  emits("close");
};
const canvasToBlob = () => {
  canvasRef.value.toBlob((blob) => {
    file.value = convertFile(blob);
  }, "image/png");
};

const convertFile = (blob) => {
  let name = "user.png";
  return new File([blob], name);
};

const cameraOpen = ref(false);
const isPhotoTaken = ref(false);
const isShotPhoto = ref(false);
const isLoading = ref(false);

const cameraRef = ref(null);
const canvasRef = ref(null);
const imageSrc = ref("");
const height = ref(0);
const width = ref(0);
const streaming = ref(false);
const photoRef = ref(null);
const toggleCamera = () => {
  if (cameraOpen.value) {
    cameraOpen.value = false;
    isPhotoTaken.value = false;
    isShotPhoto.value = false;
    stopCameraStream();
  } else {
    cameraOpen.value = true;
    createCameraElement();
  }
};

const createCameraElement = () => {
  isLoading.value = true;
  navigator.mediaDevices
      .getUserMedia({video: true, audio: false})
    .then(function (stream) {
      cameraRef.value.srcObject = stream;
      cameraRef.value.play();
      isLoading.value = false;
    })
    .catch(function (err) {
      isLoading.value = false;
      emits("close");
    });
};

const stopCameraStream = () => {
  let tracks = cameraRef.value.srcObject.getTracks();

  tracks.forEach((track) => {
    track.stop();
  });
};

const cameraSetup = () => {
  debug();
  if (!streaming.value) {
    height.value = cameraRef.value.videoHeight;
    width.value = cameraRef.value.videoWidth;
    cameraRef.value.setAttribute("width", width.value);
    cameraRef.value.setAttribute("height", height.value);
    canvasRef.value.setAttribute("width", width.value);
    canvasRef.value.setAttribute("height", height.value);
    streaming.value = true;
  }
};
const takePhoto = () => {
  isPhotoTaken.value = true;
  const context = canvasRef.value.getContext("2d");
  if (width.value && height.value) {
    width.value = 400;
    height.value = width.value / (4 / 3);
    canvasRef.value.width = 400;
    canvasRef.value.height = height.value;
    context.drawImage(cameraRef.value, 0, 0, width.value, height.value);
    imageSrc.value = canvasRef.value.toDataURL("image/png");
    canvasToBlob();
  }
};
const downloadImage = () => {
  const download = document.getElementById("downloadPhoto");
  const canvas = canvasRef.value
    .toDataURL("image/jpeg")
    .replace("image/jpeg", "image/octet-stream");
  download.setAttribute("href", canvas);
};

onMounted(() => {
  toggleCamera();
});

onBeforeUnmount(() => {
  stopCameraStream();
});
</script>
<style scoped>
.full-screen {
  width: 100vw;
  height: 100vh;
}

.relative {
  position: relative;
}

.top-right {
  position: absolute;
  top: 0;
  right: 0;
}

.top-left {
  position: absolute;
  top: 0;
  left: 0;
}

.bottom-center {
  position: absolute;
  bottom: 15px;
  left: 50%;
  right: 50%;
}

.bottom-left {
  position: absolute;
  left: 0;
  bottom: 5px;
}

.bordered {
  border: white 3px solid;
}

img {
  width: 200px;
}
</style>
