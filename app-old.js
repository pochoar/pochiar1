/* Mi experiencia WebAR — MindAR.js
   Configuración rápida:
   1) En index.html, ajustá width/height de videoPlane e imagePlane a la proporción de tu marcador.
   2) Para mostrar una imagen en vez de un video, cambiá SHOW_MODE a "image".
*/
(() => {
  const SHOW_MODE = "video"; // "video" o "image"
  const startButton = document.getElementById("start");
  const welcome = document.getElementById("welcome");
  const status = document.getElementById("status");
  const scene = document.querySelector("a-scene");
  const video = document.getElementById("overlayVideo");
  const videoPlane = document.getElementById("videoPlane");
  const imagePlane = document.getElementById("imagePlane");
  const target = document.getElementById("target");

  if (SHOW_MODE === "image") {
    videoPlane.setAttribute("visible", "false");
    imagePlane.setAttribute("visible", "true");
  } else {
    videoPlane.setAttribute("visible", "true");
    imagePlane.setAttribute("visible", "false");
  }

  const setStatus = (message) => { status.textContent = message; };

  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    startButton.textContent = "Iniciando…";
    setStatus("Solicitando acceso a la cámara…");
    try {
      welcome.style.display = "none";
      const mindar = scene.systems["mindar-image-system"];
      await mindar.start();
      setStatus("Cámara activa. Buscando el marcador…");
    } catch (error) {
      console.error(error);
      welcome.style.display = "flex";
      startButton.disabled = false;
      startButton.textContent = "Reintentar cámara";
      setStatus("No se pudo iniciar la cámara. Abrí la página por HTTPS y revisá los permisos.");
    }
  });

  target.addEventListener("targetFound", async () => {
    setStatus("¡Imagen reconocida!");
    if (SHOW_MODE === "video") {
      try { await video.play(); } catch (error) {
        setStatus("Imagen reconocida. Tocá la pantalla si el navegador bloqueó el video.");
        console.warn("El navegador requiere interacción para reproducir el video:", error);
      }
    }
  });

  target.addEventListener("targetLost", () => {
    setStatus("Marcador perdido. Volvé a apuntar hacia la imagen.");
    if (SHOW_MODE === "video") video.pause();
  });

  scene.addEventListener("arReady", () => setStatus("Cámara lista. Buscando el marcador…"));
  scene.addEventListener("arError", () => setStatus("Error de AR. Revisá HTTPS, permisos y archivos."));
})();
