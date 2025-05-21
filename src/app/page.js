import VideoFadeGenerator from '../component/VideoFadeGenerator';
import styles from '../component/VideoFadeGenerator.module.css'
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <VideoFadeGenerator />
    </main>
  );
}