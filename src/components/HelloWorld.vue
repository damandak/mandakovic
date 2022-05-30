<template>
  <div class="hello">
    <h1>MANDAKOVIC</h1>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@media only screen and (max-width: 915px) {
  h1 {
    font-size: 40px !important;
  }
}
h1 {
  font-size: 100px;
  margin-top: 30vh;
}
</style>
