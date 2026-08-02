"use client";

import { useBgm } from "@/components/BgmProvider";
import styles from "./BgmPlayer.module.css";

export default function BgmPlayer() {
  const {
    tracks,
    selectedTrackId,
    volumePercent,
    isPlaying,
    status,
    noteText,
    togglePlayback,
    handleTrackChange,
    handleVolumeChange,
  } = useBgm();

  return (
    <div className={styles.container}>
      <div className={styles.selectWrap}>
        <label className={styles.label} htmlFor="bgm-select">
          BGM を選択
        </label>
        <select
          id="bgm-select"
          className={styles.select}
          value={selectedTrackId}
          onChange={(event) => handleTrackChange(event.target.value)}
        >
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.volumeWrap}>
        <label className={styles.label} htmlFor="bgm-volume">
          音量: {volumePercent}%
        </label>
        <input
          id="bgm-volume"
          type="range"
          className={styles.volumeSlider}
          min="0"
          max="100"
          step="1"
          value={volumePercent}
          onChange={(event) => handleVolumeChange(Number(event.target.value))}
        />
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={togglePlayback}
        disabled={status === "error"}
      >
        {isPlaying ? "BGMを停止" : "BGMを再生"}
      </button>
      <p className={styles.note}>{noteText}</p>
    </div>
  );
}
