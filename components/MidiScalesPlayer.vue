<template>
  <div>
    <div class="row">
      <h2>MIDI Scales Player</h2>
    </div>
    <div class="row mt-3">
      <label for="root-note-select">Root note:</label>
      <select id="root-note-select" v-model="selectedRootNote" @change="stop" class="form-control">
        <option v-for="rootNote in rootNotes" v-bind:value="rootNote">
          {{ rootNote.name }}
        </option>
      </select>
    </div>
    <div class="row mt-3">
      <label for="octave-select">Number of octaves:</label>
      <select id="octave-select" v-model="selectedNumberOfOctaves" @change="stop" class="form-control">
        <option v-for="octave in octavesList" v-bind:value="octave">
          {{ octave }}
        </option>
      </select>
    </div>
    <div class="row mt-3">
      <label for="scale-select">Scale:</label>
      <select id="scale-select" v-model="selectedScaleIntervals" @change="stop" class="form-control">
        <option v-for="scaleInterval in scaleIntervalsList" v-bind:value="scaleInterval.intervals">
          {{ scaleInterval.name }}
        </option>
      </select>
    </div>
    <div class="row mt-3">
      <label for="bpm-input">Tempo:</label>
      <input id="bpm-input" type="range" min="25" max="200" v-model="bpm" class="form-control" />
      <span class="form-control text-center">{{ bpm }} BPM</span>
    </div>
    <div class="row mt-3">
      <div class="form-check form-check-inline">
        <input id="degrees-check" type="checkbox" v-model="showDegrees" class="form-check-input"/>
        <label for="degrees-check" class="form-check-label">Show scale degrees</label>
      </div>
    </div>

    <div class="row mt-4">
      <button type="button" class="btn btn-primary btn-block" v-if="!running" v-on:click="start">Start</button>
      <button type="button" class="btn btn-primary btn-block" v-if="running" v-on:click="stop">Stop</button>
    </div>

    <div class="row no-gutters" v-if="showDegrees">
      <div v-for="note in degrees" class="col">
        <div class="card mx-1 mt-3 note text-white" v-bind:class="{ 'bg-secondary': !note.active, 'bg-success': note.active }" v-on:click="playSingleNote(note)">
          <div class="card-body">
            <h4 class="card-title text-center">{{ note.degree }}</h4>
            <p class="card-text text-center">{{ note.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <ul v-for="note in playedNotes" v-if="!running" class="mt-4">
      <li>Degree: {{ note.degree }} - Name: {{ note.name }}</li>
    </ul>
  </div>
</template>

<script>
module.exports = {
  created() {
    this.init({ volume: 127, velocity: 127, bpm: 45 });
  },
  data: function() {
    return {
      volume: 0, // general volume of the midi output
      bpm: 0, // beats per minute
      velocity: 0, // how hard the note hits

      rootNotes: [], // the possible root notes for the scale
      octavesList: [1, 2, 3, 4], // the number of octaves for the scale

      scaleIntervalsList: [ // selectable scales
        { name: "Major", intervals: [2, 2, 1, 2, 2, 2, 1] },
        { name: "Natural minor", intervals: [2, 1, 2, 2, 1, 2, 2] },
        { name: "Harmonic minor", intervals: [2, 1, 2, 2, 1, 3, 1] },
        { name: "Melodic minor", intervals: [2, 1, 2, 2, 2, 2, 1] },
        { name: "Phrygian", intervals: [1, 2, 2, 2, 1, 2, 2] }
      ],

      selectedNumberOfOctaves: 1,
      selectedRootNote: 0,
      selectedScaleIntervals: [],

      scale: [],
      cadence: [],
      notesToPlay: [],

      playedNotes: [],

      degrees: [],
      showDegrees: true,

      running: false
    }
  },
  computed: {
    speed: function() {
      return Math.floor((60  / this.bpm) * 1000); // Convert bpm to milliseconds
    }
  },
  methods: {
    init: function(options, afterInit) {
      this.volume = options.volume;
      this.bpm = options.bpm;
      this.velocity = options.velocity;

      this.rootNotes = [];
      for (var rootNote = 21; rootNote < 108; rootNote++) {
        this.rootNotes.push({ name: MIDI.noteToKey[rootNote], degree: 1, value: rootNote, active: false });
      }

      this.selectedRootNote = this.rootNotes[24];
      this.selectedScaleIntervals = this.scaleIntervalsList[0].intervals;

      MIDI.loadPlugin({
        soundfontUrl: "midi-js/examples/soundfont/",
        instrument: "acoustic_grand_piano",
        onprogress: (state, progress) => {
          console.log(state, progress);
        },
        onsuccess: () => {
          console.log("Init success!");
          MIDI.setVolume(0, this.volume);

          if (typeof(afterInit)  === "function") {
            afterInit();
          }
        }
      });
    },
    calculateScale: function (numberOfOctaves) {
      var scale = [this.selectedRootNote];
      var nextNote = this.selectedRootNote;
      for (var octave = 0; octave < numberOfOctaves; octave++) {
        for (var interval = 0; interval < this.selectedScaleIntervals.length; interval++) {
          nextNote = {
            name: MIDI.noteToKey[nextNote.value + this.selectedScaleIntervals[interval]],
            degree: (nextNote.degree % 7) + 1,
            value: nextNote.value + this.selectedScaleIntervals[interval],
            active: false
          };
          scale.push(nextNote);
        }
      }

      console.log("Scale: " + JSON.stringify(scale));
      return scale;
    },
    calculateCadence: function() {
      var scaleForCadence = this.calculateScale(2);
      var tonic = [scaleForCadence[0], scaleForCadence[2], scaleForCadence[4]];
      var subdominant = [scaleForCadence[3], scaleForCadence[5], scaleForCadence[7]];
      var dominant = [scaleForCadence[4], scaleForCadence[6], scaleForCadence[8]];

      return [tonic, subdominant, dominant, tonic];
    },
    getRandomNoteFromScale: function() {
      return this.scale[Math.floor(Math.random() * this.scale.length)];
    },
    playNotes: function(notesToPlay, noteNumber) {
      var noteToPlay = notesToPlay[noteNumber];

      if (noteToPlay && Array.isArray(noteToPlay)) {
        MIDI.chordOn(0, [noteToPlay[0].value, noteToPlay[1].value, noteToPlay[2].value], this.velocity, 0);
        console.log("Playing chord " + noteToPlay[0].name + "," + noteToPlay[1].name + "," + noteToPlay[2].name);
      } else if (noteToPlay && typeof(noteToPlay.value) === "number") {
        MIDI.noteOn(0, noteToPlay.value, this.velocity, 0);
        this.degrees[noteToPlay.degree - 1].active = true;
        console.log("Playing note " + noteToPlay.name);
        this.playedNotes.push(noteToPlay);
      }

      setTimeout(() => {
        if (noteToPlay && Array.isArray(noteToPlay)) {
          MIDI.chordOff(0,[noteToPlay[0].value, noteToPlay[1].value, noteToPlay[2].value], 0);
        } else if (noteToPlay && typeof(noteToPlay.value) === "number") {
          MIDI.noteOff(0, notesToPlay[noteNumber].value, 0);
          this.degrees[noteToPlay.degree - 1].active = false;
        }

        noteNumber++;
        if (this.running && noteNumber < notesToPlay.length) {
          // Play next note/chord
          this.playNotes(notesToPlay, noteNumber);
        } else if (this.running && noteNumber == notesToPlay.length) {
          // Add more notes and play next note
          this.addNotesToPlay();
          this.playNotes(notesToPlay, noteNumber);
        } else {
          // Stop playing
          this.stop();
        }
      }, this.speed);
    },
    addNotesToPlay: function() {
      console.log("Adding notes to play");
      for (var i = 0; i < 16; i++) {
        this.notesToPlay.push(this.getRandomNoteFromScale());
      }
    },
    playSingleNote: function(noteToPlay) {
      this.degrees[noteToPlay.degree - 1].active = true;
      MIDI.noteOn(0, noteToPlay.value, this.velocity, 0);
      console.log("Manually playing note " + noteToPlay.name);

      setTimeout(() => {
        MIDI.noteOff(0, noteToPlay.value, 0);
        this.degrees[noteToPlay.degree - 1].active = false;
      }, this.speed);
    },
    start: function() {
      console.log("Started");
      this.running = true;

      this.cadence = this.calculateCadence();
      this.scale = this.calculateScale(this.selectedNumberOfOctaves);
      this.degrees = this.calculateScale(1);

      // Degrees should only range from 1 to 7
      this.degrees.pop();

      this.notesToPlay = this.cadence;
      this.playedNotes = [];

      // Add rest
      this.notesToPlay.push(null);

      this.addNotesToPlay();

      this.playNotes(this.notesToPlay, 0);
    },
    stop: function() {
      this.running = false;
      console.log("Stopped");
    }
  }
}
</script>
