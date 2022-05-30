<template>
  <router-view />
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Inknut+Antiqua:wght@300;400;500;600;700;800;900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

#app {
  font-family: "Inknut Antiqua", serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  height: 100%;
  width: 100%;
  margin: 0;
  position: absolute;
  top: 0;
  left: 0;
}

nav {
  padding: 30px;

  a {
    font-family: "Kanit", sans-serif;
    font-weight: bold;
    color: white;
    display: inline-block;
    text-decoration: none;
    &.router-link-exact-active {
      color: #85f781;
    }
  }
}
</style>
