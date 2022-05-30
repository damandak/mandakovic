<template>
  <transition>
    <div class="home">
      <HelloWorld msg="Welcome to Your Vue.js App" />
    </div>
  </transition>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "HomeView",
  components: {
    HelloWorld,
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
}
</style>
