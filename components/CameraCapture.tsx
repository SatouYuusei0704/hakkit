"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CameraCapture.module.css";

type Props = {
  onCapture: (file: File) => void;
  onCancel: () => void;
};

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  function handleSwitchCamera() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  function handleShutter() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }

  function handleFileFallback(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  }

  return (
    <div className={styles.overlay}>
      <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="閉じる">
        ×
      </button>

      {error ? (
        <div className={styles.errorBox}>
          <p>カメラを利用できませんでした。</p>
          <label className={styles.fallbackLabel}>
            ファイルから選ぶ
            <input
              type="file"
              accept="image/*"
              onChange={handleFileFallback}
              className={styles.hiddenInput}
            />
          </label>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`${styles.video} ${facingMode === "user" ? styles.mirrored : ""}`}
          />
          <button
            type="button"
            className={styles.switchButton}
            onClick={handleSwitchCamera}
            aria-label="カメラを切り替える"
          >
            🔄
          </button>
          <button
            type="button"
            className={styles.shutterButton}
            onClick={handleShutter}
            aria-label="撮影する"
          />
        </>
      )}
    </div>
  );
}
