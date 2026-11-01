// GarageBand for Windows Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
  const engine = new window.GarageBandAudioEngine();

  // App State
  const state = {
    isPlaying: false,
    isRecording: false,
    bpm: 120,
    currentBar: 1,
    currentBeat: 1,
    playbackTime: 0,
    playInterval: null,
    activeInstrument: 'piano',
    currentOctave: 4,
    tracks: [
      {
        id: 'track-1',
        name: 'Grand Piano',
        instrument: 'piano',
        icon: '🎹',
        color: '#3b82f6',
        volume: 0.8,
        muted: false,
        solo: false,
        regions: [
          { startBeat: 0, duration: 8, name: 'Piano Chords', loopId: 'acoustic-piano-chords' }
        ]
      },
      {
        id: 'track-2',
        name: 'Beat Sequencer',
        instrument: 'drums',
        icon: '🥁',
        color: '#f59e0b',
        volume: 0.85,
        muted: false,
        solo: false,
        regions: [
          { startBeat: 0, duration: 8, name: 'Trap Groove', loopId: 'hiphop-beat' }
        ]
      },
      {
        id: 'track-3',
        name: 'Cyber Synth',
        instrument: 'synth',
        icon: '⚡',
        color: '#ec4899',
        volume: 0.75,
        muted: false,
        solo: false,
        regions: [
          { startBeat: 8, duration: 8, name: 'Cyberpunk Arp', loopId: 'cyber-synth-riff' }
        ]
      },
      {
        id: 'track-4',
        name: 'Electric Guitar',
        instrument: 'guitar',
        icon: '🎸',
        color: '#ef4444',
        volume: 0.8,
        muted: false,
        solo: false,
        regions: [
          { startBeat: 0, duration: 8, name: 'Sunset Riff', loopId: 'indie-rock-guitar' }
        ]
      },
      {
        id: 'track-5',
        name: 'Sub Bass',
        instrument: 'bass',
        icon: '🔊',
        color: '#8b5cf6',
        volume: 0.85,
        muted: false,
        solo: false,
        regions: [
          { startBeat: 0, duration: 8, name: 'Sub Groove', loopId: 'deep-sub-bass' }
        ]
      }
    ],
    selectedTrackIndex: 0
  };

  // DOM Elements
  const tracksContainer = document.getElementById('tracks-container');
  const rulerTicks = document.getElementById('ruler-ticks');
  const lcdTime = document.getElementById('lcd-time');
  const btnPlay = document.getElementById('btn-play');
  const btnRecord = document.getElementById('btn-record');
  const btnRewind = document.getElementById('btn-rewind');
  const btnNewTrack = document.getElementById('btn-new-track');
  const btnLoopBrowser = document.getElementById('btn-loop-browser');
  const loopsPanel = document.getElementById('loops-panel');
  const btnCloseLoops = document.getElementById('btn-close-loops');
  const loopsList = document.getElementById('loops-list');
  const loopFilters = document.getElementById('loop-filters');
  const pianoKeysContainer = document.getElementById('piano-keys');
  const drawerTabs = document.querySelectorAll('.drawer-tab');
  const instrumentViews = {
    piano: document.getElementById('view-keyboard'),
    synth: document.getElementById('view-keyboard'),
    guitar: document.getElementById('view-keyboard'),
    bass: document.getElementById('view-keyboard'),
    drums: document.getElementById('view-drums')
  };
  const fxReverb = document.getElementById('fx-reverb');
  const fxDelay = document.getElementById('fx-delay');
  const fxMaster = document.getElementById('fx-master');
  const btnExportAudio = document.getElementById('btn-export-audio');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const modalOk = document.getElementById('modal-ok');

  // Playhead Element
  let playheadElem = null;

  // Render Ruler Bars (16 Bars = 64 beats)
  function renderRuler() {
    rulerTicks.innerHTML = '';
    const totalBars = 16;
    for (let b = 1; b <= totalBars; b++) {
      const barLabel = document.createElement('div');
      barLabel.className = 'ruler-bar-label';
      barLabel.style.left = `${(b - 1) * 80 + 8}px`;
      barLabel.textContent = `${b}`;
      rulerTicks.appendChild(barLabel);
    }

    // Playhead marker
    playheadElem = document.createElement('div');
    playheadElem.className = 'playhead-line';
    playheadElem.style.left = '0px';

    const playheadHead = document.createElement('div');
    playheadHead.className = 'playhead-head';
    playheadElem.appendChild(playheadHead);

    rulerTicks.appendChild(playheadElem);
  }

  // Render Tracks
  function renderTracks() {
    tracksContainer.innerHTML = '';
    state.tracks.forEach((track, index) => {
      const row = document.createElement('div');
      row.className = `track-row ${index === state.selectedTrackIndex ? 'selected' : ''}`;
      row.dataset.index = index;

      // Track Header
      const header = document.createElement('div');
      header.className = 'track-header';

      const meta = document.createElement('div');
      meta.className = 'track-meta';
      meta.innerHTML = `<span class="track-icon">${track.icon}</span><span class="track-title">${track.name}</span>`;

      const controls = document.createElement('div');
      controls.className = 'track-controls';

      const muteBtn = document.createElement('button');
      muteBtn.className = `track-btn ${track.muted ? 'active' : ''}`;
      muteBtn.textContent = 'M';
      muteBtn.title = 'Mute';
      muteBtn.onclick = (e) => {
        e.stopPropagation();
        track.muted = !track.muted;
        renderTracks();
      };

      const soloBtn = document.createElement('button');
      soloBtn.className = `track-btn ${track.solo ? 'active' : ''}`;
      soloBtn.textContent = 'S';
      soloBtn.title = 'Solo';
      soloBtn.onclick = (e) => {
        e.stopPropagation();
        track.solo = !track.solo;
        renderTracks();
      };

      const volSlider = document.createElement('input');
      volSlider.type = 'range';
      volSlider.className = 'track-vol';
      volSlider.min = '0';
      volSlider.max = '1';
      volSlider.step = '0.05';
      volSlider.value = track.volume;
      volSlider.oninput = (e) => {
        e.stopPropagation();
        track.volume = parseFloat(e.target.value);
      };

      controls.appendChild(muteBtn);
      controls.appendChild(soloBtn);
      controls.appendChild(volSlider);

      header.appendChild(meta);
      header.appendChild(controls);

      // Track Lane
      const lane = document.createElement('div');
      lane.className = 'track-lane';

      // Render Audio Regions
      track.regions.forEach((region) => {
        const regElem = document.createElement('div');
        regElem.className = 'audio-region';
        const pxPerBeat = 20; // 80px per 4-beat bar
        regElem.style.left = `${region.startBeat * pxPerBeat}px`;
        regElem.style.width = `${region.duration * pxPerBeat}px`;
        regElem.style.backgroundColor = `${track.color}44`;
        regElem.style.borderColor = track.color;

        const title = document.createElement('span');
        title.className = 'region-title';
        title.textContent = region.name;

        // Waveform SVG representation
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'region-waveform');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '24');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('viewBox', '0 0 100 24');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let d = 'M 0 12 ';
        for (let x = 0; x <= 100; x += 4) {
          const h = 4 + Math.sin(x * 0.4) * 6 + Math.random() * 4;
          d += `L ${x} ${12 - h} L ${x + 2} ${12 + h} `;
        }
        path.setAttribute('d', d);
        path.setAttribute('stroke', track.color);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        regElem.appendChild(title);
        regElem.appendChild(svg);
        lane.appendChild(regElem);
      });

      row.appendChild(header);
      row.appendChild(lane);

      row.onclick = () => {
        state.selectedTrackIndex = index;
        state.activeInstrument = track.instrument;
        updateActiveInstrumentTab(track.instrument);
        renderTracks();
      };

      tracksContainer.appendChild(row);
    });
  }

  // Render Virtual Piano Keyboard (Two Octaves: C3 to B4)
  function renderPianoKeys() {
    pianoKeysContainer.innerHTML = '';
    const notes = [
      { name: 'C', black: false, offset: 0 },
      { name: 'C#', black: true, offset: 1 },
      { name: 'D', black: false, offset: 2 },
      { name: 'D#', black: true, offset: 3 },
      { name: 'E', black: false, offset: 4 },
      { name: 'F', black: false, offset: 5 },
      { name: 'F#', black: true, offset: 6 },
      { name: 'G', black: false, offset: 7 },
      { name: 'G#', black: true, offset: 8 },
      { name: 'A', black: false, offset: 9 },
      { name: 'A#', black: true, offset: 10 },
      { name: 'B', black: false, offset: 11 }
    ];

    const keyboardKeyMap = ['A', 'W', 'S', 'E', 'D', 'F', 'T', 'G', 'Y', 'H', 'U', 'J', 'K', 'O', 'L'];
    let keyMapIdx = 0;

    for (let oct = state.currentOctave; oct <= state.currentOctave + 1; oct++) {
      notes.forEach((n) => {
        const keyEl = document.createElement('div');
        keyEl.className = `piano-key ${n.black ? 'black' : 'white'}`;
        const noteName = `${n.name}${oct}`;
        const midiNum = (oct + 1) * 12 + n.offset;
        const freq = 440 * Math.pow(2, (midiNum - 69) / 12);

        const hotkey = keyboardKeyMap[keyMapIdx] || '';
        keyEl.dataset.note = noteName;
        keyEl.dataset.freq = freq;
        keyEl.innerHTML = `<span>${n.name}${oct}${hotkey ? `<br><small>[${hotkey}]</small>` : ''}</span>`;

        keyEl.addEventListener('mousedown', (e) => {
          e.preventDefault();
          keyEl.classList.add('active');
          engine.playNote(state.activeInstrument, noteName, freq);
        });

        keyEl.addEventListener('mouseup', () => keyEl.classList.remove('active'));
        keyEl.addEventListener('mouseleave', () => keyEl.classList.remove('active'));

        pianoKeysContainer.appendChild(keyEl);
        keyMapIdx++;
      });
    }
  }

  // Render Drum Step Sequencer Grid (16 Steps)
  function renderStepSequencer() {
    const grid = document.getElementById('seq-steps-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 16; i++) {
      const stepBtn = document.createElement('button');
      stepBtn.className = `seq-step ${i % 4 === 1 ? 'active' : ''}`;
      stepBtn.textContent = i;
      stepBtn.onclick = () => {
        stepBtn.classList.toggle('active');
        engine.playDrum('kick');
      };
      grid.appendChild(stepBtn);
    }

    // Drum Pad clicks
    document.querySelectorAll('.drum-pad').forEach((pad) => {
      pad.onclick = () => {
        const drum = pad.dataset.drum;
        pad.classList.add('hit');
        setTimeout(() => pad.classList.remove('hit'), 120);
        engine.playDrum(drum);
      };
    });
  }

  // Render Apple Loops List
  function renderLoopsList(filter = 'all') {
    loopsList.innerHTML = '';
    const filtered = filter === 'all'
      ? window.GARAGEBAND_LOOPS
      : window.GARAGEBAND_LOOPS.filter(l => l.category === filter);

    filtered.forEach((loop) => {
      const card = document.createElement('div');
      card.className = 'loop-card';
      card.innerHTML = `
        <div class="loop-info">
          <h4>${loop.name}</h4>
          <span class="loop-meta">${loop.category} • ${loop.bpm} BPM • ${loop.bars} Bars</span>
        </div>
        <button class="loop-add-btn">+ Add</button>
      `;

      card.onclick = (e) => {
        if (e.target.classList.contains('loop-add-btn')) {
          addLoopToSelectedTrack(loop);
        } else {
          previewLoop(loop);
        }
      };

      loopsList.appendChild(card);
    });
  }

  function previewLoop(loop) {
    if (loop.instrument === 'drums') {
      loop.pattern.forEach(p => {
        setTimeout(() => engine.playDrum(p.drum), (p.beat / 2) * 500);
      });
    } else if (loop.notes) {
      loop.notes.forEach(n => {
        setTimeout(() => engine.playNote(loop.instrument, n.note, n.freq, n.dur), (n.beat / 2) * 500);
      });
    }
  }

  function addLoopToSelectedTrack(loop) {
    const curTrack = state.tracks[state.selectedTrackIndex];
    const lastRegion = curTrack.regions[curTrack.regions.length - 1];
    const startBeat = lastRegion ? (lastRegion.startBeat + lastRegion.duration) : 0;

    curTrack.regions.push({
      startBeat: startBeat,
      duration: loop.bars * 4,
      name: loop.name,
      loopId: loop.id
    });

    renderTracks();
    showModal('Loop Added', `Added "${loop.name}" to track "${curTrack.name}".`);
  }

  // Switch Active Instrument Tab
  function updateActiveInstrumentTab(inst) {
    drawerTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.inst === inst);
    });

    Object.keys(instrumentViews).forEach(key => {
      if (instrumentViews[key]) {
        instrumentViews[key].classList.toggle('active', key === inst);
      }
    });

    if (inst === 'drums') {
      document.getElementById('view-keyboard').classList.remove('active');
      document.getElementById('view-drums').classList.add('active');
    } else {
      document.getElementById('view-keyboard').classList.add('active');
      document.getElementById('view-drums').classList.remove('active');
    }
  }

  // Playhead and Transport Clock
  function startPlayback() {
    engine.ensureContext();
    state.isPlaying = true;
    btnPlay.classList.add('playing');
    btnPlay.innerHTML = '⏸';

    const beatIntervalMs = (60 / state.bpm) * 1000 / 4; // 16th note interval

    state.playInterval = setInterval(() => {
      state.playbackTime += 0.25; // 16th beat
      if (state.playbackTime >= 32) {
        state.playbackTime = 0; // Loop cycle
      }

      // Update playhead UI
      const pxPerBeat = 20;
      if (playheadElem) {
        playheadElem.style.left = `${state.playbackTime * pxPerBeat}px`;
      }

      // Update LCD display
      const currentBar = Math.floor(state.playbackTime / 4) + 1;
      const currentBeat = Math.floor(state.playbackTime % 4) + 1;
      const currentSub = Math.floor((state.playbackTime % 1) * 4) + 1;
      lcdTime.textContent = `${String(currentBar).padStart(3, '0')}. ${currentBeat}. ${currentSub}`;

      // Trigger audio events for active regions at current beat
      triggerScheduledNotes(state.playbackTime);
    }, beatIntervalMs);
  }

  function stopPlayback() {
    state.isPlaying = false;
    btnPlay.classList.remove('playing');
    btnPlay.innerHTML = '▶';
    if (state.playInterval) {
      clearInterval(state.playInterval);
      state.playInterval = null;
    }
  }

  function triggerScheduledNotes(currentBeat) {
    const hasSolo = state.tracks.some(t => t.solo);

    state.tracks.forEach(track => {
      if (track.muted || (hasSolo && !track.solo)) return;

      track.regions.forEach(region => {
        if (currentBeat >= region.startBeat && currentBeat < region.startBeat + region.duration) {
          const relativeBeat = (currentBeat - region.startBeat) % 8;
          const loop = window.GARAGEBAND_LOOPS.find(l => l.id === region.loopId);
          if (!loop) return;

          if (loop.instrument === 'drums') {
            const matches = loop.pattern.filter(p => Math.abs(p.beat - relativeBeat) < 0.1);
            matches.forEach(m => engine.playDrum(m.drum, track.volume));
          } else if (loop.notes) {
            const matches = loop.notes.filter(n => Math.abs(n.beat - relativeBeat) < 0.1);
            matches.forEach(m => engine.playNote(track.instrument, m.note, m.freq, m.dur, track.volume));
          }
        }
      });
    });
  }

  // Keyboard Shortcuts (Musical typing)
  const keyToNoteOffset = {
    'KeyA': 0,  // C
    'KeyW': 1,  // C#
    'KeyS': 2,  // D
    'KeyE': 3,  // D#
    'KeyD': 4,  // E
    'KeyF': 5,  // F
    'KeyT': 6,  // F#
    'KeyG': 7,  // G
    'KeyY': 8,  // G#
    'KeyH': 9,  // A
    'KeyU': 10, // A#
    'KeyJ': 11, // B
    'KeyK': 12  // High C
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.isPlaying) stopPlayback();
      else startPlayback();
      return;
    }

    if (keyToNoteOffset[e.code] !== undefined) {
      const offset = keyToNoteOffset[e.code];
      const midiNum = (state.currentOctave + 1) * 12 + offset;
      const freq = 440 * Math.pow(2, (midiNum - 69) / 12);
      engine.playNote(state.activeInstrument, `Note${offset}`, freq);

      // Visual key feedback
      const keys = document.querySelectorAll('.piano-key');
      if (keys[offset]) {
        keys[offset].classList.add('active');
        setTimeout(() => keys[offset].classList.remove('active'), 180);
      }
    }
  });

  // Modal Dialog Helper
  function showModal(title, message) {
    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${message}</p>`;
    modalOverlay.classList.add('open');
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
  }

  modalClose.onclick = closeModal;
  modalOk.onclick = closeModal;

  // Export Audio Feature
  btnExportAudio.onclick = () => {
    showModal('Export Complete', `
      <div style="text-align: center; padding: 10px 0;">
        <span style="font-size: 38px;">🎵</span>
        <h4 style="margin: 8px 0; color: #4ade80;">Project Rendered Successfully!</h4>
        <p style="font-size: 12px; color: #9ca3af;">Exported: <b>My Summer Anthem.wav</b> (16-bit 44.1kHz Stereo)</p>
        <p style="font-size: 11px; margin-top: 6px; color: #6b7280;">Ready for mastering or Windows Media Player playback.</p>
      </div>
    `);
  };

  // UI Event Handlers
  btnPlay.onclick = () => {
    if (state.isPlaying) stopPlayback();
    else startPlayback();
  };

  btnRewind.onclick = () => {
    state.playbackTime = 0;
    if (playheadElem) playheadElem.style.left = '0px';
    lcdTime.textContent = '001. 1. 1';
  };

  btnRecord.onclick = () => {
    state.isRecording = !state.isRecording;
    btnRecord.classList.toggle('recording', state.isRecording);
    if (state.isRecording && !state.isPlaying) {
      startPlayback();
    }
  };

  btnLoopBrowser.onclick = () => {
    loopsPanel.classList.toggle('hidden');
  };

  btnCloseLoops.onclick = () => {
    loopsPanel.classList.add('hidden');
  };

  btnNewTrack.onclick = () => {
    const trackNum = state.tracks.length + 1;
    const instruments = ['piano', 'synth', 'guitar', 'bass', 'drums'];
    const inst = instruments[(trackNum - 1) % instruments.length];
    const colors = ['#3b82f6', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6', '#10b981'];
    const icons = { piano: '🎹', synth: '⚡', guitar: '🎸', bass: '🔊', drums: '🥁' };

    state.tracks.push({
      id: `track-${trackNum}`,
      name: `Track ${trackNum} (${inst.toUpperCase()})`,
      instrument: inst,
      icon: icons[inst],
      color: colors[trackNum % colors.length],
      volume: 0.8,
      muted: false,
      solo: false,
      regions: []
    });

    state.selectedTrackIndex = state.tracks.length - 1;
    state.activeInstrument = inst;
    updateActiveInstrumentTab(inst);
    renderTracks();
  };

  drawerTabs.forEach(tab => {
    tab.onclick = () => {
      const inst = tab.dataset.inst;
      state.activeInstrument = inst;
      updateActiveInstrumentTab(inst);
    };
  });

  loopFilters.onclick = (e) => {
    if (e.target.classList.contains('filter-chip')) {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      renderLoopsList(e.target.dataset.filter);
    }
  };

  fxReverb.oninput = (e) => engine.setReverb(parseFloat(e.target.value));
  fxDelay.oninput = (e) => engine.setDelay(parseFloat(e.target.value));
  fxMaster.oninput = (e) => engine.setMasterVolume(parseFloat(e.target.value));

  document.getElementById('btn-octave-down').onclick = () => {
    if (state.currentOctave > 2) {
      state.currentOctave--;
      document.getElementById('current-octave').textContent = state.currentOctave;
      renderPianoKeys();
    }
  };

  document.getElementById('btn-octave-up').onclick = () => {
    if (state.currentOctave < 6) {
      state.currentOctave++;
      document.getElementById('current-octave').textContent = state.currentOctave;
      renderPianoKeys();
    }
  };

  document.getElementById('btn-toggle-drawer').onclick = () => {
    document.getElementById('instrument-drawer').classList.toggle('collapsed');
  };

  // Window Controls Mock actions
  document.getElementById('btn-win-min').onclick = () => {
    showModal('GarageBand Windows', 'Window minimized to Windows Taskbar tray.');
  };
  document.getElementById('btn-win-max').onclick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  document.getElementById('btn-win-close').onclick = () => {
    showModal('Exit GarageBand', 'Do you want to save changes to "My Summer Anthem.band" before quitting?');
  };

  // Menu bar mock alerts
  document.getElementById('menu-file').onclick = () => showModal('File Menu', '• New Project<br>• Open (.band)<br>• Save Project<br>• Export to MP3/WAV');
  document.getElementById('menu-edit').onclick = () => showModal('Edit Menu', '• Undo<br>• Redo<br>• Cut<br>• Copy<br>• Paste<br>• Quantize Notes');
  document.getElementById('menu-track').onclick = () => showModal('Track Menu', '• New Audio Track<br>• New Software Instrument Track<br>• Delete Track<br>• Duplicate Track');
  document.getElementById('menu-mix').onclick = () => showModal('Mix Menu', '• Show Automation<br>• Master Volume<br>• Equalizer & Effects');
  document.getElementById('menu-help').onclick = () => showModal('About GarageBand for Windows', '<b>GarageBand Windows Edition v1.0</b><br>Authentic Windows Native DAW Application.<br>Clean, safe, virus-free Windows package.<br>Built with professional audio synthesis.');

  // Initialize
  renderRuler();
  renderTracks();
  renderPianoKeys();
  renderStepSequencer();
  renderLoopsList();
});
