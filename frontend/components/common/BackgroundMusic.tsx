"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Track {
  id: number;
  name: string;
  src: string;
}

const tracks: Track[] = [
  { id: 1, name: "Nhạc nền 1", src: "/sounds/background-music-1.mp3" },
  { id: 2, name: "Nhạc nền 2", src: "/sounds/background-music-2.mp3" },
  { id: 3, name: "Nhạc nền 3", src: "/sounds/background-music-3.mp3" },
];

const BackgroundMusic = () => {
  const { t } = useTranslation("common");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(tracks[currentTrackIndex].src);
    audioRef.current.loop = false;
    audioRef.current.volume = volume;

    // Load saved preferences
    const savedVolume = localStorage.getItem("bgMusicVolume");
    const savedTrack = localStorage.getItem("bgMusicTrack");
    const savedMuted = localStorage.getItem("bgMusicMuted");

    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (audioRef.current) audioRef.current.volume = vol;
    }
    if (savedTrack) {
      const trackIndex = parseInt(savedTrack);
      if (trackIndex >= 0 && trackIndex < tracks.length) {
        setCurrentTrackIndex(trackIndex);
        if (audioRef.current) audioRef.current.src = tracks[trackIndex].src;
      }
    }
    if (savedMuted === "true") {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.muted = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.pause();
      audioRef.current.src = tracks[currentTrackIndex].src;
      audioRef.current.load();
      localStorage.setItem("bgMusicTrack", currentTrackIndex.toString());
      if (wasPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrackIndex]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Auto play next track
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrackIndex]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    localStorage.setItem("bgMusicVolume", newVolume.toString());
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
      localStorage.setItem("bgMusicMuted", "false");
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
    localStorage.setItem("bgMusicMuted", (!isMuted).toString());
  };

  const playPrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const playNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setShowDropdown(false);
    if (!isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`p-2 rounded-full transition-all duration-300 ${
          isPlaying
            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30"
            : "hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-600 dark:text-gray-300"
        }`}
        title={t("header.backgroundMusic") || "Nhạc nền"}
      >
        <Music className={`w-5 h-5 ${isPlaying ? "animate-pulse" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-neutral-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Music className="w-4 h-4" />
                {t("header.backgroundMusic") || "Nhạc nền"}
              </h3>
            </div>

            {/* Current Track Info */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-gray-700">
              <p className="text-xs text-neutral-500 dark:text-gray-400 mb-1">
                {t("header.nowPlaying") || "Đang phát"}
              </p>
              <p className="font-medium text-neutral-800 dark:text-white truncate">
                {tracks[currentTrackIndex].name}
              </p>

              {/* Progress Bar */}
              <div className="mt-2">
                <div
                  className="h-1.5 bg-neutral-200 dark:bg-gray-600 rounded-full cursor-pointer overflow-hidden"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-100"
                    style={{
                      width: duration
                        ? `${(progress / duration) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-400 dark:text-gray-500 mt-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 py-3 flex items-center justify-center gap-4">
              <button
                onClick={playPrevious}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-600 dark:text-gray-300 transition-colors"
                title={t("header.previousTrack") || "Bài trước"}
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                title={
                  isPlaying
                    ? t("header.pause") || "Tạm dừng"
                    : t("header.play") || "Phát"
                }
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-600 dark:text-gray-300 transition-colors"
                title={t("header.nextTrack") || "Bài sau"}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="px-4 py-3 border-t border-neutral-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-600 dark:text-gray-300 transition-colors"
                  title={
                    isMuted
                      ? t("header.unmute") || "Bật âm"
                      : t("header.mute") || "Tắt âm"
                  }
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1.5 bg-neutral-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:bg-teal-500
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:bg-teal-500
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:border-0"
                />
                <span className="text-xs text-neutral-500 dark:text-gray-400 w-8 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Track List */}
            <div className="border-t border-neutral-100 dark:border-gray-700">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-neutral-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{t("header.selectTrack") || "Chọn bài nhạc"}</span>
                {showVolumeSlider ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {tracks.map((track, index) => (
                      <button
                        key={track.id}
                        onClick={() => selectTrack(index)}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                          currentTrackIndex === index
                            ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                            : "hover:bg-neutral-50 dark:hover:bg-gray-700 text-neutral-700 dark:text-gray-300"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentTrackIndex === index
                              ? "bg-teal-500 text-white"
                              : "bg-neutral-200 dark:bg-gray-600 text-neutral-500 dark:text-gray-400"
                          }`}
                        >
                          {currentTrackIndex === index && isPlaying ? (
                            <div className="flex gap-0.5 items-end h-3">
                              <span
                                className="w-0.5 bg-white animate-bounce"
                                style={{ height: "8px", animationDelay: "0ms" }}
                              />
                              <span
                                className="w-0.5 bg-white animate-bounce"
                                style={{
                                  height: "12px",
                                  animationDelay: "150ms",
                                }}
                              />
                              <span
                                className="w-0.5 bg-white animate-bounce"
                                style={{
                                  height: "6px",
                                  animationDelay: "300ms",
                                }}
                              />
                            </div>
                          ) : (
                            <Music className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {track.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackgroundMusic;
