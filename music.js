const backgroundMusic = document.getElementById("backgroundMusic");
const toggleMusicButton = document.getElementById("toggleMusic");
const musicStatus = document.getElementById("musicStatus");

if (typeof window.yinYangMusic !== "string") {
  musicStatus.textContent = "No se encontró la canción";
  toggleMusicButton.disabled = true;
  console.error("No se encontró la pista incrustada en music-data.js.");
} else {
  backgroundMusic.src = window.yinYangMusic;
  toggleMusicButton.disabled = false;
}

toggleMusicButton.addEventListener("click", async () => {
  if (backgroundMusic.paused) {
    await playMusic();
  } else {
    backgroundMusic.pause();
    musicStatus.textContent = "En pausa";
    toggleMusicButton.textContent = "▶";
    toggleMusicButton.setAttribute("aria-label", "Reproducir música");
    toggleMusicButton.title = "Reproducir";
  }
});

backgroundMusic.addEventListener("error", () => {
  musicStatus.textContent = "No se pudo cargar la canción";
  toggleMusicButton.disabled = true;
  console.error("No se pudo cargar Ja Tebia Liubliu (Remastered).mp3.", backgroundMusic.error);
});

async function playMusic() {
  try {
    await backgroundMusic.play();
    musicStatus.textContent = "Reproduciendo";
    toggleMusicButton.textContent = "Ⅱ";
    toggleMusicButton.setAttribute("aria-label", "Pausar música");
    toggleMusicButton.title = "Pausar";
  } catch (error) {
    if (error.name === "NotAllowedError") {
      musicStatus.textContent = "Pulsa ▶ para escuchar";
    } else {
      console.error("No se pudo reproducir la canción.", error);
      musicStatus.textContent = "No se pudo reproducir";
    }
    toggleMusicButton.textContent = "▶";
    toggleMusicButton.setAttribute("aria-label", "Reproducir música");
    toggleMusicButton.title = "Reproducir";
  }
}

if (!toggleMusicButton.disabled) playMusic();
