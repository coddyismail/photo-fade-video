'use client'
import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
// import styles from './VideoFadeGenerator.module.css';
import './VideoFadeGenerator.module.css'

export default function VideoFadeGenerator() {
  const [ffmpeg, setFFmpeg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [image, setImage] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
      const ffmpegInstance = new FFmpeg();
      ffmpegInstance.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setFFmpeg(ffmpegInstance);
      setLoaded(true);
    };
    loadFFmpeg();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setVideoUrl(null); // Clear previous video
    };
    reader.readAsDataURL(file);
  };

  const generateVideo = async () => {
    if (!image || !ffmpeg) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Write the image file to FFmpeg's virtual file system
      const inputName = 'input.jpg';
      const outputName = 'output.mp4';
      
      await ffmpeg.writeFile(inputName, await fetchFile(image));
      
      // Run FFmpeg command to create fade-in effect
      await ffmpeg.exec([
        '-loop', '1',
        '-i', inputName,
        '-vf', 'fade=t=in:st=0:d=2',
        '-t', '10',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        outputName
      ]);
      
      // Read the result
      const data = await ffmpeg.readFile(outputName);
      
      // Create a URL for the video
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'fade-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="video-fade-container">
      <h1 className="video-fade-title">Photo-to-Video Fade Generator</h1>
      
      <div className="video-fade-card">
        {!loaded ? (
          <div className="video-fade-loading">
            <p>Loading FFmpeg...</p>
            <progress className="video-fade-progress" max="100" value={progress}></progress>
          </div>
        ) : (
          <>
            <div className="video-fade-upload-section">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="video-fade-file-input"
              />
              <button
                onClick={triggerFileInput}
                className="video-fade-upload-btn"
              >
                Upload Photo
              </button>
            </div>
            
            {image && (
              <div className="video-fade-preview-section">
                <h2 className="video-fade-preview-title">Preview</h2>
                <div className="video-fade-preview-container">
                  <img src={image} alt="Preview" className="video-fade-preview-image" />
                </div>
              </div>
            )}
            
            {image && !videoUrl && (
              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className={`video-fade-generate-btn ${isGenerating ? 'disabled' : ''}`}
              >
                {isGenerating ? `Generating Video... ${progress}%` : 'Generate Video'}
              </button>
            )}
            
            {videoUrl && (
              <div className="video-fade-result-section">
                <h2 className="video-fade-result-title">Generated Video</h2>
                <div className="video-fade-video-container">
                  <video controls className="video-fade-video">
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <button
                  onClick={downloadVideo}
                  className="video-fade-download-btn"
                >
                  Download Video
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="video-fade-footer">
        <p>The video will fade in for the first 2 seconds and remain visible for 10 seconds total.</p>
      </div>
    </div>
  );
}