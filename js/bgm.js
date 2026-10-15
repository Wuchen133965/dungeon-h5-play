'use strict';
// Original looping score; plain media playback also supports static/file URLs.
const BGM = { audio: null, playing: false, starting: false };
function bgmUpdateVolume() {
  if (!BGM.audio) return;
  const quiet = typeof G !== 'undefined' && ['play', 'chest', 'choice', 'shrine'].includes(G.mode);
  const volume = typeof TITLE_SETTINGS !== 'undefined' ? TITLE_SETTINGS.volume / 100 : 1;
  BGM.audio.volume = muted ? 0 : (quiet ? .20 : .30) * volume;
  BGM.audio.muted = muted;
}
function bgmStart() {
  if (typeof window.Audio !== 'function' || document.hidden || BGM.starting) return;
  if (!BGM.audio) {
    BGM.audio = new window.Audio('assets/audio/dungeon-theme.wav'); BGM.audio.loop = true; BGM.audio.preload = 'auto';
    BGM.audio.addEventListener('error', () => { BGM.playing = false; BGM.starting = false; });
  }
  bgmUpdateVolume();
  if (BGM.playing && !BGM.audio.paused) return;
  BGM.starting = true;
  try {
    Promise.resolve(BGM.audio.play()).then(() => { BGM.playing = !BGM.audio.paused; BGM.starting = false; }, () => { BGM.starting = false; BGM.playing = false; });
  } catch (_) { BGM.starting = false; }
}
document.addEventListener('visibilitychange', () => {
  if (!BGM.audio) return;
  if (document.hidden) { BGM.audio.pause(); BGM.playing = false; }
  else bgmStart();
});
