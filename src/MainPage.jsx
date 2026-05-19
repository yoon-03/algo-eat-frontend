import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const navigate = useNavigate();
  const [allFoods, setAllFoods] = useState([]);
  const [displayMenus, setDisplayMenus] = useState([]);
  const [nickname, setNickname] = useState("사용자");
  
  // ⭐ 직전에 선택한 메뉴를 기억하는 상태
  const [selectedFood, setSelectedFood] = useState(null);

  const TEST_USER_ID = localStorage.getItem("userId") || 1;

  useEffect(() => {
    const savedNickname = localStorage.getItem("userNickname") || "테스트유저";
    setNickname(savedNickname);
    fetchFoods(); // 초기 로드
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/foods?userId=${TEST_USER_ID}`);
      if (!response.ok) throw new Error(`서버 에러! 상태 코드: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("서버에서 올바른 데이터를 주지 않았습니다.");

      setAllFoods(data);

      // 페이지를 처음 켤 때 '마지막으로 선택한 음식'이 있는지 확인합니다.
      const savedLastFood = localStorage.getItem("lastSelectedFood");
      if (savedLastFood) {
          const lastFood = JSON.parse(savedLastFood);
          setSelectedFood(lastFood);
          // 저장된 직전 음식이 있다면, 이를 기준으로 2+2 추천 API 호출!
          fetchRecommendations(lastFood.foodId);
      } else {
          pickRandomMenus(data); // 기록이 없으면 완전 랜덤 4개
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      setAllFoods([]);
      setDisplayMenus([]);
    }
  };

  // ✅ 백엔드에 2+2 추천을 요청하는 전용 함수
  const fetchRecommendations = async (foodId) => {
      try {
          const response = await fetch(`http://localhost:8080/api/foods/recommend-next?userId=${TEST_USER_ID}&foodId=${foodId}`);
          if (!response.ok) throw new Error("추천 로드 실패");
          const nextData = await response.json();
          setDisplayMenus(nextData);
      } catch(error) {
          console.error("다음 단계 추천 실패: ", error);
      }
  };

  const pickRandomMenus = (dataList) => {
    if (dataList.length <= 4) {
      setDisplayMenus(dataList);
      return;
    }
    const shuffled = [...dataList].sort(() => 0.5 - Math.random());
    setDisplayMenus(shuffled.slice(0, 4));
  };

  // ✅ 새로운 메뉴 추천받기 버튼 핸들러
  const handleRefreshAll = () => {
      if (selectedFood) {
          // 직전 선택 메뉴의 성향을 유지한 채로 새로운 2+2를 섞어옵니다.
          fetchRecommendations(selectedFood.foodId);
      } else {
          pickRandomMenus(allFoods);
      }
  };

  // ✅ 취향 분석(기억) 초기화 버튼
  const handleResetStack = () => {
      if (window.confirm("지금까지의 선택 기록을 지우고 완전히 새로운 메뉴를 추천받으시겠어요?")) {
          localStorage.removeItem("lastSelectedFood");
          setSelectedFood(null);
          pickRandomMenus(allFoods);
      }
  };

  const handleDislike = async (foodId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/user/${TEST_USER_ID}/blacklist/${foodId}`, { 
        method: 'POST' 
      });
      if (!response.ok) console.error("[에러] 백엔드에서 저장을 거절했습니다.");
    } catch (error) {
      console.error("서버 통신 에러:", error);
    }

    setAllFoods(prevAllFoods => prevAllFoods.filter(f => f.foodId !== foodId));

    const currentIds = displayMenus.map(m => m.foodId);
    const availableFoods = allFoods.filter(f => 
        !currentIds.includes(f.foodId) && 
        f.foodId !== foodId &&
        (!selectedFood || f.foodId !== selectedFood.foodId)
    );
    
    if (availableFoods.length === 0) return;
    
    const newFood = availableFoods[Math.floor(Math.random() * availableFoods.length)];
    setDisplayMenus(prev => prev.map(m => m.foodId === foodId ? newFood : m));
  };

  // ⭐ 메뉴 확정 시 액션 (텍스트 및 흐름 변경)
  const handleSelectMenu = async (food) => {
      if (window.confirm(`[${food.name}]을(를) 오늘의 메뉴로 확정할까요?\n(이 선택은 다음 추천 리스트 분석에 반영됩니다!)`)) {
          
          // 🕒 현재 시간 기반 캘린더 자동 저장 로직 (유지)
          const today = new Date().getDate(); 
          const currentHour = new Date().getHours(); 
          const savedRecords = JSON.parse(localStorage.getItem("dietRecords")) || {};
          
          const dayData = savedRecords[today] || {
              breakfast: { name: "", amount: 1, cal: 0 },
              lunch: { name: "", amount: 1, cal: 0 },
              dinner: { name: "", amount: 1, cal: 0 }
          };

          let mealType = 'dinner'; 
          if (currentHour >= 5 && currentHour < 10) {
              mealType = 'breakfast';
          } else if (currentHour >= 10 && currentHour < 15) {
              mealType = 'lunch';    
          }

          dayData[mealType] = { name: food.name, amount: 1, cal: food.calories || 500 };
          savedRecords[today] = dayData;
          localStorage.setItem("dietRecords", JSON.stringify(savedRecords));

          // 현재 선택한 음식을 '마지막 선택'으로 영구 저장
          localStorage.setItem("lastSelectedFood", JSON.stringify(food));
          setSelectedFood(food); 
          
          alert("식단 캘린더에 기록되었습니다! 📝\n다음을 위한 새로운 추천 리스트를 가져옵니다.");
          
          // 다음 식사를 위한 2+2 추천 리스트 세팅
          fetchRecommendations(food.foodId);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <header className="p-4 bg-white flex justify-between items-center border-b shadow-sm">
        <h1 
          className="text-2xl font-black text-orange-600 cursor-pointer" 
          onClick={handleResetStack}
          title="처음부터 다시 추천받기"
        >
          알고잇
        </h1>
        <button onClick={() => navigate('/user')} className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors">
          👤
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {/* ⭐ 타이틀 텍스트 변경: 이전 픽 기반임을 확실하게 명시 */}
            {selectedFood ? (
                <span>
                  <span className="text-orange-600">테스트</span>님의 <span className="text-orange-600">선택</span> 기반 추천이에요!
                </span>
            ) : (
                <span><span className="text-orange-600">테스트</span>님을 위한 오늘의 메뉴</span>
            )}
          </h2>
          
          <div className="flex gap-2">
              {selectedFood && (
                  <button 
                    onClick={handleResetStack}
                    className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 font-semibold"
                  >
                    초기화
                  </button>
              )}
              <button 
                onClick={handleRefreshAll}
                className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm hover:bg-gray-50 hover:text-orange-600 transition-all font-semibold"
              >
                🔄 추천 다시받기
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayMenus.map((menu, index) => (
            <div key={menu.foodId || index} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col relative">
              
              <div className="absolute top-3 left-3 z-10">
                {index < 2 ? (
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-black rounded-full shadow-md tracking-wide">
                      {/* ⭐ 배지 레이블 텍스트 변경 */}
                      {selectedFood ? '🔥 이전 선택 반영' : '🔥 취향 저격'}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-black rounded-full shadow-md tracking-wide">
                      🎲 새로운 발견
                  </span>
                )}
              </div>

              <div className="relative w-full h-56 bg-gray-50 flex items-center justify-center overflow-hidden group/image cursor-pointer" onClick={() => handleSelectMenu(menu)}>
                {menu.imageUrl ? (
                  <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-5xl opacity-50">🍲</div>
                )}
                
                <div className="absolute inset-0 bg-orange-500 bg-opacity-80 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300 transform group-hover/image:scale-105">
                   <span className="text-white font-black text-2xl mb-2 drop-shadow-md">오늘의 메뉴</span>
                   <span className="text-white text-sm font-semibold border-b border-white pb-1">선택하시겠습니까? 🍽️</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-gray-800 leading-tight">{menu.name}</h3>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            navigate(`/detail/${menu.foodId}`);
                        }}
                        className="text-gray-400 hover:text-orange-500 transition-colors p-1"
                        title="상세 정보 보기"
                    >
                        🔍
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {menu.nation && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">#{menu.nation}</span>}
                  {menu.type && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">#{menu.type}</span>}
                  {menu.ingredient && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">#{menu.ingredient}</span>}
                </div>

                <div className="mt-auto pt-2 border-t border-gray-100">
                  <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handleDislike(menu.foodId);
                    }}
                    className="w-full text-sm text-red-500 font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    👎 이 메뉴 빼기
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>

      <footer className="p-10 flex justify-center mt-4">
        <button 
          onClick={() => navigate('/tagpage')} 
          className="px-10 py-4 bg-orange-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all transform active:scale-95"
        >
          직접 찾아볼까요? 🔍
        </button>
      </footer>
    </div>
  );
}

export default MainPage;