import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TagPage() {
  const navigate = useNavigate();
  const [allFoods, setAllFoods] = useState([]);
  const [tags, setTags] = useState([]); // 중복 제거된 모든 태그 리스트
  const [selectedTag, setSelectedTag] = useState(null); // 현재 선택된 태그

  const TEST_USER_ID = localStorage.getItem("userId") || 1;

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        // 메인 페이지와 동일하게 블랙리스트가 제외된 전체 음식 목록을 가져옵니다.
        const response = await fetch(`http://localhost:8080/api/foods?userId=${TEST_USER_ID}`);
        if (!response.ok) throw new Error("데이터를 불러오지 못했습니다.");
        
        const data = await response.json();
        setAllFoods(data);
        extractTags(data); // 데이터가 오면 태그만 쏙쏙 뽑아냅니다.
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    fetchFoods();
  }, []);

  // ✅ 음식 데이터에서 모든 카테고리(국가, 조리법, 재료, 맛)를 뽑아 중복 없는 태그 리스트 만들기
  const extractTags = (foods) => {
    const tagSet = new Set();
    
    foods.forEach(food => {
      if (food.nation) tagSet.add(food.nation);
      if (food.type) tagSet.add(food.type);
      if (food.ingredient) tagSet.add(food.ingredient);
      
      // 'taste'는 DB에 JSON 배열 형태('["진한맛", "고소함"]')로 저장되어 있으므로 파싱해서 넣습니다.
      if (food.taste) {
        try {
          const tasteArray = JSON.parse(food.taste);
          tasteArray.forEach(t => tagSet.add(t));
        } catch (e) {
          console.error("맛 태그 파싱 오류:", e);
        }
      }
    });

    // 가나다순으로 정렬해서 상태에 저장
    setTags(Array.from(tagSet).sort());
  };

  // ✅ 선택된 태그에 맞춰 음식 리스트 필터링
  const filteredFoods = selectedTag 
    ? allFoods.filter(food => {
        // 국가, 종류, 재료와 정확히 일치하거나, 맛 배열 안에 포함되어 있으면 통과!
        return (
          food.nation === selectedTag ||
          food.type === selectedTag ||
          food.ingredient === selectedTag ||
          (food.taste && food.taste.includes(selectedTag))
        );
      })
    : allFoods; // 선택된 태그가 없으면 전체 음식 보여주기

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* --- 상단 네비게이션 --- */}
      <nav className="bg-white border-b px-6 py-4 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate('/main')} className="text-2xl mr-4 text-gray-400 hover:text-orange-600 transition">←</button>
        <h1 className="text-xl font-black text-gray-800 italic">태그로 찾기 🔍</h1>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* --- 🏷️ 태그 선택 영역 --- */}
        <section className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-700">어떤 맛이 끌리시나요?</h2>
            {selectedTag && (
              <button 
                onClick={() => setSelectedTag(null)} 
                className="text-sm font-semibold text-gray-500 hover:text-orange-500"
              >
                초기화 ↺
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <button
                key={index}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} // 같은 거 또 누르면 해제
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
                  selectedTag === tag 
                    ? "bg-orange-500 text-white border-orange-500 shadow-md scale-105" 
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>

        {/* --- 🍲 필터링된 음식 결과 영역 --- */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            {selectedTag ? `'#${selectedTag}' 검색 결과 (${filteredFoods.length}개)` : "전체 메뉴 보기"}
          </h2>

          {filteredFoods.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredFoods.map(menu => (
                <div 
                    key={menu.foodId} 
                    onClick={() => navigate(`/detail/${menu.foodId}`)}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="h-40 bg-gray-100 overflow-hidden relative">
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl opacity-30">🍲</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 truncate mb-1">{menu.name}</h3>
                    <div className="flex gap-1 text-[10px] text-gray-500 truncate">
                      {menu.nation && <span>#{menu.nation}</span>}
                      {menu.type && <span>#{menu.type}</span>}
                      {menu.ingredient && <span>#{menu.ingredient}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-4">😢</div>
              <p>해당하는 메뉴가 없습니다.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default TagPage;