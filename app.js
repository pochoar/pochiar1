(() => {
  const SHOW_MODE = "video";

  const startButton = document.getElementById("start");
  const welcome = document.getElementById("welcome");
  const status = document.getElementById("status");
  const scene = document.querySelector("a-scene");
  const video = document.getElementById("overlayVideo");
  const videoPlane = document.getElementById("videoPlane");
  const imagePlane = document.getElementById("imagePlane");
  const target = document.getElementById("target");

  let starting = false;

  const setStatus = (message) => {
    status.textContent = message;
  };

  // Comprobar que el HTML contiene los elementos necesarios.
  if (!startButton || !welcome || !status || !scene || !target) {
    console.error("Faltan elementos HTML necesarios para WebAR.");
    return;
  }

  if (SHOW_MODE === "image") {
    videoPlane?.setAttribute("visible", "false");
    imagePlane?.setAttribute("visible", "true");
  } else {
    videoPlane?.setAttribute("visible", "true");
    imagePlane?.setAttribute("visible", "false");
  }

  startButton.addEventListener("click", async () => {
    if (starting) return;
    starting = true;

    startButton.disabled = true;
    startButton.textContent = "Iniciando...";
    setStatus("Comprobando cámara y sistema AR...");

    try {
      // El acceso a la cámara requiere un contexto seguro.
      if (!window.isSecureContext ||
          !navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "La página no está en HTTPS o localhost. " +
          "Publicala en una dirección HTTPS."
        );
      }

      // Esperar a que A-Frame cargue la escena.
      if (!scene.hasLoaded) {
        await new Promise((resolve, reject) => {
          scene.addEventListener("loaded", resolve, { once: true });
          setTimeout(
            () => reject(new Error("A-Frame no terminó de cargar.")),
            15000
          );
        });
      }

      const mindar = scene.systems["mindar-image-system"];

      if (!mindar || typeof mindar.start !== "function") {
        throw new Error(
          "MindAR no está inicializado. Revisá la carga de sus librerías."
        );
      }

      setStatus("Iniciando cámara y reconocimiento...");
      await mindar.start();

      welcome.style.display = "none";
      setStatus("Cámara activa. Buscando la imagen...");

    } catch (error) {
      console.error("Error al iniciar WebAR:", error);

      let message = error.message || String(error);

      if (error.name === "NotAllowedError") {
        message = "Permiso de cámara denegado. Revisá los permisos del navegador.";
      } else if (error.name === "NotFoundError") {
        message = "No se encontró una cámara disponible.";
      } else if (error.name === "NotReadableError") {
        message = "La cámara está ocupada o no se puede utilizar.";
      } else if (error.name === "OverconstrainedError") {
        message = "La cámara no admite la configuración solicitada.";
      }

      welcome.style.display = "flex";
      setStatus("Error: " + message);

    } finally {
      startButton.disabled = false;
      startButton.textContent = "Reintentar cámara";
      starting = false;
    }
  });

  target.addEventListener("targetFound", async () => {
    setStatus("¡Imagen reconocida!");

    if (SHOW_MODE === "video") {
      try {
        await video.play();
      } catch (error) {
        console.warn("No se pudo reproducir el video:", error);
        setStatus("Imagen reconocida. Tocá la pantalla para reproducir el video.");
      }
    }
  });

  target.addEventListener("targetLost", () => {
    setStatus("Imagen perdida. Volvé a apuntar hacia la tarjeta.");

    if (SHOW_MODE === "video") {
      video.pause();
    }
  });

  scene.addEventListener("arReady", () => {
    setStatus("Cámara lista. Buscando la imagen...");
  });

  scene.addEventListener("arError", (event) => {
    console.error("MindAR informó un error:", event.detail);
    setStatus("MindAR encontró un error. Consultá la consola del navegador.");
  });
})();
