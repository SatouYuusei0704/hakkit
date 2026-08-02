"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { loadBgmTrackId, loadBgmVolume, saveBgmTrackId, saveBgmVolume } from "@/lib/storage";

const tracks = [
  { id: "track1", label: "BGM 1", src: "/bgm1.mp3" },
  { id: "track2", label: "BGM 2", src: "/bgm2.mp3" },
  { id: "track3", label: "BGM 3", src: "/bgm3.mp3" },
] as const;

type BgmTrack = (typeof tracks)[number];

type BgmStatus = "loading" | "ready" | "error";

interface BgmContextValue {
  tracks: readonly BgmTrack[];
  selectedTrackId: string;
  selectedTrack: BgmTrack;
  volumePercent: number;
  isPlaying: boolean;
  status: BgmStatus;
  noteText: string;
  togglePlayback: () => Promise<void>;
  handleTrackChange: (trackId: string) => void;
  handleVolumeChange: (nextPercent: number) => void;
}

const BgmContext = createContext<BgmContextValue | undefined>(undefined);

export function BgmProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState("track1");
  const [volumePercent, setVolumePercent] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<BgmStatus>("loading");
  const [loaded, setLoaded] = useState(false);
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0];

  useEffect(() => {
    const savedTrackId = loadBgmTrackId();
    const savedVolume = loadBgmVolume();

    const timeoutId = window.setTimeout(() => {
      if (savedTrackId) {
        setSelectedTrackId(savedTrackId);
      }
      if (savedVolume !== null) {
        setVolumePercent(Math.round(savedVolume * 100));
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volumePercent / 100;
  }, [volumePercent]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlay = () => {
      setStatus("ready");
      setLoaded(true);
    };
    const handleError = () => setStatus("error");

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setStatus("loading");
    setIsPlaying(false);
    setLoaded(false);
    setAutoPlayAttempted(false);
    audio.pause();
    audio.load();
  }, [selectedTrackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (loaded && !autoPlayAttempted) {
      setAutoPlayAttempted(true);
      void audio.play().catch(() => {
        // 自動再生制限がある場合は無視
      });
    }
  }, [loaded, autoPlayAttempted]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || status === "error") return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.warn("BGM再生に失敗しました", error);
      setStatus("error");
    }
  };

  const handleTrackChange = (trackId: string) => {
    setSelectedTrackId(trackId);
    saveBgmTrackId(trackId);
  };

  const handleVolumeChange = (nextPercent: number) => {
    setVolumePercent(nextPercent);
    saveBgmVolume(nextPercent / 100);
  };

  const noteText =
    status === "error"
      ? `${selectedTrack.label}(${selectedTrack.src}) を public フォルダーに追加してください。`
      : status === "ready"
      ? `${selectedTrack.label} を再生できます。`
      : `${selectedTrack.label} を読み込み中…`;

  return (
    <BgmContext.Provider
      value={{
        tracks,
        selectedTrackId,
        selectedTrack,
        volumePercent,
        isPlaying,
        status,
        noteText,
        togglePlayback,
        handleTrackChange,
        handleVolumeChange,
      }}
    >
      <audio ref={audioRef} src={selectedTrack.src} loop preload="auto" style={{ display: "none" }} />
      {children}
    </BgmContext.Provider>
  );
}

export function useBgm() {
  const context = useContext(BgmContext);
  if (!context) {
    throw new Error("useBgm must be used within a BgmProvider");
  }
  return context;
}
