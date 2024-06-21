<template>
  <div class="relative full-screen">
    <v-btn class="top-left" @click="close"> close</v-btn>
    <v-btn class="top-right" @click="send"> send</v-btn>
    <div ref="mapContainer" class="h-screen"></div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from "vue";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import {fetchWrapper} from "@/functions/request";
const location = ref("");
const access_token =
  "pk.eyJ1IjoibmljbzgxMCIsImEiOiJjbG40ZGo0Zm4wczdmMnFucjkwdDhkaDNlIn0.Aq9I7t8RPWlLguPcpoAqMw";
const center = ref([-71.224518, 42.213995]);
const map = ref(null);
const mapContainer = ref(null);
const imageUrl = computed(() => {
  const mapcenter = map.value.getCenter();
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${
    mapcenter.lng
  },${mapcenter.lat})/${mapcenter.lng},${
    mapcenter.lat
  },${map.value.getZoom()},${map.value.getBearing()},${map.value.getPitch()}/600x400?access_token=${
    mapboxgl.accessToken
  }`;
});

const emits = defineEmits(["close"]);
const file = ref(null);
const send = async () => {
  const data = await fetch(imageUrl.value);
  const image = await data.blob();
  const blob = new Blob([image], {type: "image/png"});
  file.value = new File([blob], "map.png", {type: "image/png"});
  const mapcenter = map.value.getCenter();
  const countryState = (
    await fetchWrapper.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${mapcenter.lng},${mapcenter.lat}.json?access_token=${access_token}`,
    )
  ).features[0].context.slice(-2);
  if (file.value !== null)
    emits(
      "close",
      [file.value],
        encodeURIComponent(countryState[0].text),
    );
};

const close = () => {
  emits("close");
};

const first = ref(true);

const createMap = () => {
  mapboxgl.accessToken = access_token;
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: "mapbox://styles/mapbox/streets-v11",
    center: center.value,
    zoom: 11,
  });

  const marker = new mapboxgl.Marker({
    draggable: true,
    color: "#D80739",
  });

  const updateLocation = () => {
    center.value = map.value.getCenter();
  };

  marker.setLngLat(center.value).addTo(map.value);

  marker.on("dragend", (e) => {
    center.value = Object.values(e.target.getLngLat());
    map.value.flyTo({
      center: center.value,
      essential: true,
    });
  });

  const geocoder = new MapboxGeocoder({
    accessToken: access_token,
    mapboxgl: mapboxgl,
    marker: false,
  });

  map.value.addControl(geocoder, "bottom-right");

  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
    showAccuracyCircle: false,
    showUserLocation: false,
  });

  map.value.addControl(geolocate, "bottom-right");

  map.value.on("move", updateLocation);
  map.value.on("zoom", updateLocation);
  map.value.on("rotate", updateLocation);
  map.value.on("pitch", updateLocation);

  const nav = new mapboxgl.NavigationControl({
    visualizePitch: true,
    showZoom: true,
  });

  map.value.addControl(nav, "bottom-right");

  geocoder.on("result", (e) => {
    marker.setLngLat(e.result.center);
    center.value = e.result.center;
  });

  geolocate.on("geolocate", (e) => {
    center.value = [e.coords.longitude, e.coords.latitude];
  });

  watch(center, () => {
    marker.setLngLat(center.value);
  });
};

onMounted(() => {
  createMap();
});
</script>

<style scoped>
@import "https://api.tiles.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css";

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
  z-index: 2;
}

.top-left {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}
</style>
