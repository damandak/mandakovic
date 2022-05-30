<template>
  <div class="hello">
    <h1 id="main-title">MANDAKOVIC</h1>
  </div>
</template>

<script>
export default {
  name: "MandakovicTitle",
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@media only screen and (max-width: 915px) {
  #main-title {
    font-size: 30px !important;
  }
}
#main-title {
  font-size: 100px;
  margin-top: 30vh;
  text-decoration: none;
  color: white;
}
</style>
