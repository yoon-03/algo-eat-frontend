import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RecipePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedMenu = location.state?.selectedMenu || "요리";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipeVideos();
  }, [selectedMenu]);

  const fetchRecipeVideos = async () => {
    try {
      setLoading(true);

      const query = `${selectedMenu} 레시피`;

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=8&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("YouTube API 요청 실패");
      }

      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error("레시피 영상 로드 실패:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b px-6 py-5 flex justify-between items-center shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-600 font-black hover:text-orange-700 transition"
        >
          <span className="text-2xl">←</span> 뒤로가기
        </button>

        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900 italic">
            {selectedMenu} 요리법 🎬
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            YouTube Recipe Videos
          </p>
        </div>

        <div className="w-20" />
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center text-gray-500 font-bold mt-20">
            레시피 영상을 불러오는 중...
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-500 font-bold mt-20">
            레시피 영상을 찾지 못했어요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id.videoId}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
              >
                <div className="aspect-video bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.id.videoId}`}
                    title={video.snippet.title}
                    allowFullScreen
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-black text-gray-800 line-clamp-2">
                    {video.snippet.title}
                  </h3>

                  <p className="text-sm text-gray-400 mt-2">
                    {video.snippet.channelTitle}
                  </p>

                  <a
                    href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-center w-full py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition"
                  >
                    YouTube에서 보기
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default RecipePage;