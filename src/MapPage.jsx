import React from 'react';

// 1. 임시 주변 식당 데이터 (나중에 API로 불러올 부분)
const NEARBY_RESTAURANTS = [
  { id: 1, name: "든든한 한끼 식당", dist: "350m", rating: 4.8, review: 124, tag: "건강식 전문", emoji: "🍱" },
  { id: 2, name: "그린 샐러드 카페", dist: "500m", rating: 4.5, review: 89, tag: "다이어트식", emoji: "🥗" },
  { id: 3, name: "연어의 꿈", dist: "850m", rating: 4.9, review: 210, tag: "고단백 연어", emoji: "🍣" },
  { id: 4, name: "우리집 집밥", dist: "1.2km", rating: 4.2, review: 56, tag: "가성비 백반", emoji: "🍲" },
];

function MapPage({ onBack }) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      
      {/* 2. 상단 헤더 바 */}
      <header className="bg-white border-b px-6 py-5 flex justify-between items-center shadow-sm z-10">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-orange-600 font-black hover:text-orange-700 transition"
        >
          <span className="text-2xl">←</span> 뒤로가기
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900 italic">내 주변 식당 찾기 📍</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nearby Healthy Food</p>
        </div>
        <div className="w-20"></div> {/* 좌측 버튼과의 균형을 위한 빈 공간 */}
      </header>

      {/* 3. 지도 및 인터페이스 영역 */}
      <div className="flex-1 relative bg-slate-200">
        
        {/* 가상의 지도 배경 (실제 API 연동 시 이 div에 지도가 들어갑니다) */}
        <div className="absolute inset-0 flex items-center justify-center bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/127.0276,37.4979,13,0/800x600?access_token=YOUR_TOKEN')] bg-cover bg-center">
          {/* 지도 중심 핀 (애니메이션 효과) */}
          <div className="relative">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce border-4 border-white">
              <span className="text-white text-xl">📍</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm"></div>
          </div>
          
          {/* 가상의 식당 핀들 */}
          <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-orange-400 text-sm">🥗</div>
          <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-orange-400 text-sm">🍣</div>
        </div>

        {/* 4. 하단 식당 정보 카드 리스트 (가로 스크롤) */}
        <div className="absolute bottom-8 left-0 right-0 px-6 overflow-x-auto flex gap-4 no-scrollbar pb-4">
          {NEARBY_RESTAURANTS.map((shop) => (
            <div 
              key={shop.id} 
              className="min-w-[300px] bg-white rounded-3xl p-5 shadow-2xl flex gap-4 items-center border border-orange-50 hover:border-orange-200 transition-colors cursor-pointer group"
            >
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                {shop.emoji}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                    {shop.tag}
                  </span>
                  <span className="text-xs text-gray-400 font-bold">{shop.dist}</span>
                </div>
                <h4 className="text-lg font-black text-gray-800">{shop.name}</h4>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-orange-500 text-sm font-bold">⭐ {shop.rating}</span>
                  <span className="text-gray-300 text-xs font-medium">리뷰 {shop.review}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 5. 현위치 재설정 버튼 */}
        <button className="absolute top-6 right-6 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl hover:bg-orange-50 transition active:scale-90 border border-gray-100">
          🎯
        </button>
      </div>

    </div>
  );
}

export default MapPage;