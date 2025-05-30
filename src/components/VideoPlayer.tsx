
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Maximize, Pause, Play, Settings, SkipBack, SkipForward } from 'lucide-react';
import { type Source } from '@/services/streamingApi';
import SourceSelector from './SourceSelector';

interface VideoPlayerProps {
  sources: Source[];
  title: string;
  autoPlay?: boolean;
  onClose?: () => void;
}

const VideoPlayer = ({ sources, title, autoPlay = true, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentSource, setCurrentSource] = useState<Source>(
    // Default to StreamVid provider if available, otherwise use the first source
    sources.find(s => s.provider === 'StreamVid') || 
    sources.find(s => s.provider === 'Direct') || 
    sources[0]
  );
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamVid = currentSource.provider === 'StreamVid';

  useEffect(() => {
    if (isStreamVid) {
      // For StreamVid sources, we don't need to handle video events
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    
    if (autoPlay) {
      try {
        video.play().catch(error => console.error("Autoplay prevented:", error));
      } catch (error) {
        console.error("Autoplay error:", error);
      }
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoPlay, currentSource.url, isStreamVid]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => {
    if (isStreamVid) {
      // For StreamVid, we can't control play/pause directly
      // Could implement a postMessage API if StreamVid supports it
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => console.error("Play prevented:", error));
    }
    
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (isStreamVid) {
      // For StreamVid, we can't control mute directly
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isStreamVid) {
      // For StreamVid, we can't control seeking directly
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setControlsVisible(true);
    
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !isStreamVid) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  const handleSkipForward = () => {
    if (isStreamVid) return;
    if (!videoRef.current) return;
    videoRef.current.currentTime += 10;
  };

  const handleSkipBackward = () => {
    if (isStreamVid) return;
    if (!videoRef.current) return;
    videoRef.current.currentTime -= 10;
  };

  const handleSourceChange = (source: Source) => {
    // Save current playback position if not switching to/from StreamVid
    const currentPosition = !isStreamVid && videoRef.current ? videoRef.current.currentTime : 0;
    
    setCurrentSource(source);
    
    // After source change, try to restore position (only for regular video sources)
    if (source.provider !== 'StreamVid') {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentPosition;
          if (isPlaying) {
            videoRef.current.play().catch(e => console.error("Play error after source change:", e));
          }
        }
      }, 100);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={() => !isStreamVid && (controlsVisible ? togglePlay() : setControlsVisible(true))}
    >
      {/* StreamVid Player (iframe) */}
      {isStreamVid ? (
        <iframe
          ref={iframeRef}
          src={currentSource.url}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        ></iframe>
      ) : (
        /* Regular Video Element */
        <video
          ref={videoRef}
          src={currentSource.url}
          className="w-full h-full"
          playsInline
        />
      )}
      
      {/* Loading Spinner (only for non-StreamVid) */}
      {isLoading && !isStreamVid && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Title overlay (shows briefly) */}
      {controlsVisible && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium text-lg">{title}</h3>
            
            {/* Source Selector */}
            <div onClick={(e) => e.stopPropagation()}>
              <SourceSelector 
                sources={sources}
                currentSource={currentSource}
                onSelectSource={handleSourceChange}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Video controls (only show full controls for non-StreamVid sources) */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {!isStreamVid && (
          <>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-sm">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 rounded-full bg-gray-600 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-white text-sm">{formatTime(duration)}</span>
            </div>
            
            {/* Control buttons for regular video */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); handleSkipBackward(); }}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); handleSkipForward(); }}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                >
                  <Maximize className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20" 
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* For StreamVid, only show the fullscreen button */}
        {isStreamVid && (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20" 
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
