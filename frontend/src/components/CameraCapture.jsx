import { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw, Check, SwitchCamera } from "lucide-react";

// In-app camera for devices where <input capture> doesn't open a camera (laptops/desktops).
// Calls onCapture(file) with a JPEG File, or onClose() when dismissed.
const CameraCapture = ({ onCapture, onClose, onUseFiles }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [photo, setPhoto] = useState(null); // { url, blob }
  const [error, setError] = useState("");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (photo) return;
    let cancelled = false;

    const start = async () => {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open the camera.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();
        setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (err) {
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings."
            : err?.name === "NotFoundError"
              ? "No camera was found on this device."
              : "Couldn't start the camera.",
        );
      }
    };

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, photo]);

  // Free the preview URL when it's replaced or the modal closes
  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Front camera preview is mirrored; save it the way the user saw it
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        setPhoto({ url: URL.createObjectURL(blob), blob });
      },
      "image/jpeg",
      0.9,
    );
  };

  const usePhoto = () => {
    const file = new File([photo.blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <h3 className="font-semibold">Take a photo</h3>
          <button
            onClick={onClose}
            title="Close camera"
            className="p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center px-6">
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <button
                onClick={onUseFiles}
                className="px-4 py-2 text-sm font-semibold btn-primary rounded-xl"
              >
                Choose from files instead
              </button>
            </div>
          ) : photo ? (
            <img src={photo.url} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
            />
          )}
        </div>

        {!error && (
          <div className="flex items-center justify-center gap-6 py-4">
            {photo ? (
              <>
                <button
                  onClick={() => setPhoto(null)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-full"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={usePhoto}
                  title="Use photo"
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold btn-primary rounded-full"
                >
                  <Check className="w-4 h-4" />
                  Use photo
                </button>
              </>
            ) : (
              <>
                <span className="w-10" />
                <button
                  onClick={takePhoto}
                  title="Take photo"
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 hover:scale-105 active:scale-95 transition-transform"
                >
                  <Camera className="w-7 h-7 text-gray-900" />
                </button>
                {hasMultipleCameras ? (
                  <button
                    onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
                    title="Switch camera"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                ) : (
                  <span className="w-10" />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
