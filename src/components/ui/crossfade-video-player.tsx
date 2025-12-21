'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CrossfadeVideoPlayerProps {
  videoSources: [string, string]; // Exactly two video sources
  transitionDuration?: number; // Duration of crossfade in seconds
  videoDuration?: number; // Duration each video plays before transitioning
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const CrossfadeVideoPlayer: React.FC<CrossfadeVideoPlayerProps> = ({
  videoSources,
  transitionDuration = 1.5, // 1.5 seconds for blur + crossfade
  videoDuration = 10, // 10 seconds per video
  containerRef,
}) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState<0 | 1>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // Video dimensions for dynamic scaling
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });
  const [containerDims, setContainerDims] = useState({ w: 0, h: 0 });

  // Monitor container size changes
  useEffect(() => {
    if (!containerRef?.current) return;

    const container = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDims({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);

    // Initial container dims
    setContainerDims({
      w: container.offsetWidth,
      h: container.offsetHeight,
    });

    return () => observer.disconnect();
  }, [containerRef]);

  // Get video dimensions from the first video
  useEffect(() => {
    const video = video1Ref.current;
    if (!video) return;

    const updateVideoMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoDims({
          w: video.videoWidth,
          h: video.videoHeight,
        });
      }
    };

    if (video.readyState >= 1) {
      updateVideoMetadata();
    }

    video.addEventListener('loadedmetadata', updateVideoMetadata);
    return () => video.removeEventListener('loadedmetadata', updateVideoMetadata);
  }, []);

  // Handle video transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      // After transition completes, switch active video and reset transition state
      setTimeout(() => {
        setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
        setIsTransitioning(false);
      }, transitionDuration * 1000);
    }, videoDuration * 1000);

    return () => clearInterval(interval);
  }, [videoDuration, transitionDuration]);

  // Preload and sync videos
  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    // Both videos should be playing, but only one visible at a time
    video1.play().catch(console.error);
    video2.play().catch(console.error);

    // Sync video playback when switching
    const syncVideos = () => {
      if (activeVideoIndex === 0 && video2.currentTime !== video1.currentTime) {
        video2.currentTime = video1.currentTime;
      } else if (activeVideoIndex === 1 && video1.currentTime !== video2.currentTime) {
        video1.currentTime = video2.currentTime;
      }
    };

    const syncInterval = setInterval(syncVideos, 100);
    return () => clearInterval(syncInterval);
  }, [activeVideoIndex]);

  const getDynamicVideoStyle = (): React.CSSProperties => {
    if (!videoDims.w || !videoDims.h || !containerDims.w || !containerDims.h) {
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0
      };
    }

    // CONTENT_ASPECT_RATIO is the ratio of the "useful" area of the video
    const CONTENT_ASPECT_RATIO = 9 / 16;

    const scale = Math.max(
      containerDims.h / videoDims.h,
      containerDims.w / (videoDims.h * CONTENT_ASPECT_RATIO)
    );

    return {
      width: `${videoDims.w * scale}px`,
      height: `${videoDims.h * scale}px`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 'none',
      objectFit: 'fill',
      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 -2px 8px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.2)',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
    };
  };

  const getVideoClassName = (videoIndex: 0 | 1): string => {
    const baseClasses = 'absolute inset-0 w-full h-full';
    const isActive = activeVideoIndex === videoIndex;

    if (isTransitioning) {
      // During transition: blur both and crossfade
      return `${baseClasses} transition-all duration-[${transitionDuration * 1000}ms] ${
        isActive
          ? 'opacity-0 blur-md' // Outgoing video: blur and fade out
          : 'opacity-100 blur-md' // Incoming video: blur and fade in (will remove blur after transition)
      }`;
    }

    // Not transitioning: show active video clearly, hide inactive
    return `${baseClasses} transition-all duration-[${transitionDuration * 1000}ms] ${
      isActive
        ? 'opacity-100 blur-0' // Active video: fully visible, no blur
        : 'opacity-0 blur-md' // Inactive video: hidden with blur
    }`;
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Video 1 */}
      <div className={getVideoClassName(0)}>
        <video
          ref={video1Ref}
          style={{
            ...getDynamicVideoStyle(),
            transition: `opacity ${transitionDuration}s ease-in-out, filter ${transitionDuration}s ease-in-out`,
          }}
          autoPlay
          loop
          muted
          playsInline
          poster="/images/signin-image.png"
          aria-label="Emergency preparedness hero video"
        >
          <source src={videoSources[0]} type="video/mp4" />
        </video>
      </div>

      {/* Video 2 */}
      <div className={getVideoClassName(1)}>
        <video
          ref={video2Ref}
          style={{
            ...getDynamicVideoStyle(),
            transition: `opacity ${transitionDuration}s ease-in-out, filter ${transitionDuration}s ease-in-out`,
          }}
          autoPlay
          loop
          muted
          playsInline
          poster="/images/signin-image.png"
          aria-label="Emergency preparedness hero video"
        >
          <source src={videoSources[1]} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};
