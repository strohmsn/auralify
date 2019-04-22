<template>
  <div>
    <h2>Pitch Visualizer</h2>
    <p>Current pitch: {{ currentPitch }}</p>
  </div>
</template>

<script>
module.exports = {
  created() {
    console.log("Pitch visualizer created.");
    this.init();
  },
  beforeDestroy() {
    console.log("Before pitch visualizer is destroyed.");
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
    }
  },
  data: function() {
    return {
      currentPitch: 0,
      mediaStreamSource: null,
      scriptProcessor: null
    }
  },
  methods: {
    init: function(options) {
      var vm = this;

      // Get microphone access
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
        var context = new AudioContext();
        vm.mediaStreamSource = context.createMediaStreamSource(stream);
        vm.scriptProcessor = context.createScriptProcessor(1024, 1, 1);

        vm.mediaStreamSource.connect(vm.scriptProcessor);
        vm.scriptProcessor.connect(context.destination);

        var Pitchfinder = require("pitchfinder");
        var detectPitch = Pitchfinder.YIN();

        vm.scriptProcessor.onaudioprocess = function(e) {
          var newPitch = vm.midiFromFrequency(detectPitch(e.inputBuffer.getChannelData(0)));
          if (newPitch) {
            vm.currentPitch = newPitch;
          }

        };
      });
    },
    midiFromFrequency: function(frequency) {
      var lineal = 12 * ((Math.log(frequency) - Math.log(440)) / Math.log(2))
      var midi = Math.round(69 + lineal)
      return MIDI.noteToKey[midi];
    }
  }
}
</script>
