<template>
  <div>
    <div class="row">
      <h2>Pitch Visualizer</h2>
    </div>
  </div>
</template>

<script>
var Pitchfinder = require("pitchfinder");

module.exports = {
  created() {
    console.log("Pitch visualizer created");
  },
  data: function() {
    return {
      test: 1
    }
  },
  methods: {
    init: function(options) {
      this.test = options.test;
    },
  }
}
</script>
