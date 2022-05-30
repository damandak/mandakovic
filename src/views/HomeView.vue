<template>
  <router-view>
    <div class="home-cobija">
      <mandakovic-title />
    </div>
    <div class="home">
      <mandakovic-title />
    </div>
  </router-view>
</template>

<script>
import MandakovicTitle from "@/components/MandakovicTitle.vue";
export default {
  name: "HomeView",
  components: {
    MandakovicTitle,
  },
};
</script>
<style>
.home {
  background: url("~@/assets/vis.jpg") no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  height: 100%;
  position: absolute;
  width: 100vw;
  animation: fadeIn 10s infinite alternate;
}
.home-cobija {
  background: url("~@/assets/cobija.jpg") no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  height: 100%;
  position: absolute;
  width: 100vw;
  opacity: 0.7;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
}
</style>
