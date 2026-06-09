import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [selectedQuantity, setSelectedQuantity] = useState(1.0);
  const [allFoods, setAllFoods] = useState([]);
  const [displayMenus, setDisplayMenus] = useState([]);
  const [nickname, setNickname] = useState("사용자");
  const [selectedFood, setSelectedFood] = useState(null);
  const [optionFood, setOptionFood] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  const TEST_USER_ID = localStorage.getItem("userId") || 1;

  useEffect(() => {
    const savedNickname = localStorage.getItem("userNickname") || "테스트유저";
    setNickname(savedNickname);
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/foods?userId=${TEST_USER_ID}`);
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("서버에서 올바른 데이터를 주지 않았습니다.");
      }

      setAllFoods(data);

      const savedLastFood = localStorage.getItem("lastSelectedFood");

      if (savedLastFood) {
        const lastFood = JSON.parse(savedLastFood);
        setSelectedFood(lastFood);
        fetchRecommendations(lastFood.foodId);
      } else {
        pickRandomMenus(data);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      setAllFoods([]);
      setDisplayMenus([]);
    }
  };

  const fetchRecommendations = async (foodId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/foods/recommend-next?foodId=${foodId}&userId=${TEST_USER_ID}`
      );

      if (!response.ok) throw new Error("추천 로드 실패");

      const nextData = await response.json();
      setDisplayMenus(nextData);
    } catch (error) {
      console.error("다음 단계 추천 실패: ", error);
    }
  };

  const updateUserPreference = async (foodId) => {
    try {
      await fetch(`${API_BASE_URL}/api/user/${TEST_USER_ID}/preference/${foodId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("선호도 업데이트 실패:", error);
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

  const handleRefreshAll = () => {
    if (selectedFood) {
      fetchRecommendations(selectedFood.foodId);
    } else {
      pickRandomMenus(allFoods);
    }
  };

  const handleResetStack = () => {
    if (window.confirm("지금까지의 선택 기록을 지우고 완전히 새로운 메뉴를 추천받으시겠어요?")) {
      localStorage.removeItem("lastSelectedFood");
      setSelectedFood(null);
      pickRandomMenus(allFoods);
    }
  };

  const handleDislike = async (foodId) => {
    try {
      await fetch(
        `${API_BASE_URL}/api/user/${TEST_USER_ID}/blacklist/${foodId}`,
        { method: 'POST' }
      );
    } catch (error) {
      console.error("서버 통신 에러:", error);
    }

    setAllFoods(prev => prev.filter(f => f.foodId !== foodId));

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

  const saveHistoryToDB = async (foodId, mealType, quantity = 1.0) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/history/${TEST_USER_ID}/${foodId}?mealType=${mealType}&quantity=${quantity}`,
        {
          method: "POST",
        }
      );

      console.log("History 저장 응답:", response.status);

      const text = await response.text();
      console.log("History 저장 응답 내용:", text);

      return response.ok;
    } catch (error) {
      console.error("DB 식단 저장 실패:", error);
      return false;
    }
  };

  const saveSelectedFoodToCalendar = async (food, mealType, quantity = 1.0) => {
    const today = new Date().getDate();
    const savedRecords = JSON.parse(localStorage.getItem("dietRecords")) || {};

    const localMealType = mealType.toLowerCase();

    const dayData = savedRecords[today] || {
      breakfast: { name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 },
      lunch: { name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 },
      dinner: { name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 }
    };

    dayData[localMealType] = {
      name: food.name,
      amount: quantity,
      cal: (food.calories || 500) * quantity,
      carbs: (Number(food.carbs) || 0) * quantity,
      protein: (Number(food.protein) || 0) * quantity,
      fat: (Number(food.fat) || 0) * quantity
    };

    savedRecords[today] = dayData;
    localStorage.setItem("dietRecords", JSON.stringify(savedRecords));

    const savedToDB = await saveHistoryToDB(food.foodId, mealType, quantity);

    if (!savedToDB) {
      alert("DB 식단 저장에 실패했습니다. 서버 상태를 확인해주세요.");
      return false;
    }

    localStorage.setItem("lastSelectedFood", JSON.stringify(food));
    setSelectedFood(food);

    updateUserPreference(food.foodId);
    fetchRecommendations(food.foodId);

    return true;
  };

  const handleCookOption = () => {
    if (!optionFood) return;
    setSelectedAction("cook");
  };

  const handleRestaurantOption = () => {
    if (!optionFood) return;
    setSelectedAction("restaurant");
  };

  const handleMealTypeSelect = async (mealType) => {
    if (!optionFood) return;

    const action = selectedAction;
    const selectedName = optionFood.name;
    const foodToSave = optionFood;

    const saved = await saveSelectedFoodToCalendar(
      foodToSave,
      mealType,
      selectedQuantity
    );

    if (!saved) return;

    setOptionFood(null);
    setSelectedAction(null);
    setSelectedQuantity(1.0);

    if (action === "cook") {
      navigate("/recipe", {
        state: {
          selectedMenu: selectedName,
        },
      });
    } else if (action === "restaurant") {
      navigate("/map", {
        state: {
          selectedMenu: selectedName,
        },
      });
    }
  };

  const closeOptionModal = () => {
    setOptionFood(null);
    setSelectedAction(null);
    setSelectedQuantity(1.0);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans pb-28">
      <header className="sticky top-0 z-40 bg-[#faf7f2]/95 backdrop-blur px-5 pt-5 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1
              onClick={handleResetStack}
              className="text-3xl font-black text-orange-600 italic tracking-tighter cursor-pointer"
            >
              알고잇
            </h1>
          </div>

          <button
            onClick={handleRefreshAll}
            className="px-4 py-2 bg-white text-orange-600 rounded-full shadow-sm border border-orange-100 text-xs font-black active:scale-95"
          >
            🔄 새 추천
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 space-y-5">
        <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-orange-50">
          <h2 className="text-xl font-black text-gray-900">
            {selectedFood ? "선택 기반 추천이에요!" : "오늘 뭐 먹을까요?"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            메뉴를 누르면 요리하거나 근처 식당을 찾을 수 있어요.
          </p>
        </section>

        <div className="space-y-5">
          {displayMenus.map((menu, index) => (
            <div
              key={menu.foodId || index}
              className="bg-white rounded-[1.8rem] overflow-hidden shadow-md border border-gray-100 relative"
            >
              <div className="absolute top-3 left-3 z-10">
                {index < 2 ? (
                  <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full shadow">
                    🔥 취향 저격
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full shadow">
                    🎲 새로운 발견
                  </span>
                )}
              </div>

              <div
                onClick={() => setOptionFood(menu)}
                className="w-full h-52 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {menu.imageUrl ? (
                  <img
                    src={menu.imageUrl}
                    alt={menu.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl opacity-50">🍲</div>
                )}
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-xl text-gray-900">
                    {menu.name}
                  </h3>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/detail/${menu.foodId}`);
                    }}
                    className="text-gray-400 hover:text-orange-500 text-lg"
                  >
                    🔍
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {menu.nation && (
                    <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">
                      #{menu.nation}
                    </span>
                  )}
                  {menu.type && (
                    <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">
                      #{menu.type}
                    </span>
                  )}
                  {menu.ingredient && (
                    <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">
                      #{menu.ingredient}
                    </span>
                  )}
                </div>

                <div className="mb-4 bg-orange-50 rounded-2xl p-3 border border-orange-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-orange-600">영양 정보</span>
                    <span className="text-sm font-black text-gray-800">
                      {menu.calories !== null && menu.calories !== undefined
                        ? `${menu.calories} kcal`
                        : "정보 없음"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-xl py-2">
                      <p className="text-[10px] text-gray-400 font-bold">탄수화물</p>
                      <p className="text-xs font-black text-gray-700">
                        {menu.carbs !== null && menu.carbs !== undefined ? `${menu.carbs}g` : "-"}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl py-2">
                      <p className="text-[10px] text-gray-400 font-bold">단백질</p>
                      <p className="text-xs font-black text-gray-700">
                        {menu.protein !== null && menu.protein !== undefined ? `${menu.protein}g` : "-"}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl py-2">
                      <p className="text-[10px] text-gray-400 font-bold">지방</p>
                      <p className="text-xs font-black text-gray-700">
                        {menu.fat !== null && menu.fat !== undefined ? `${menu.fat}g` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {Number(menu.calories || 0) > 0 && Number(menu.calories) <= 500 && (
                      <span className="text-[10px] px-2 py-1 bg-green-100 text-green-600 rounded-full font-black">
                        🥗 저칼로리
                      </span>
                    )}

                    {Number(menu.protein || 0) >= 30 && (
                      <span className="text-[10px] px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-black">
                        💪 고단백
                      </span>
                    )}
                  </div>
                </div>

                {menu.reasons && menu.reasons.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-xs font-black text-green-700 mb-1">
                      추천 이유
                    </p>
                    {menu.reasons.map((reason, idx) => (
                      <p key={idx} className="text-xs text-green-700 leading-relaxed">
                        ✓ {reason}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDislike(menu.foodId);
                  }}
                  className="w-full py-3 text-sm text-red-500 font-bold rounded-2xl border-t border-gray-100 hover:bg-red-50"
                >
                  👎 이 메뉴 빼기
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto bg-white border-t shadow-2xl rounded-t-[2rem] px-8 py-3 flex justify-between">
          <button
            onClick={() => navigate('/main')}
            className="flex flex-col items-center text-orange-500 font-black text-xs"
          >
            <span className="text-2xl">🏠</span>
            홈
          </button>

          <button
            onClick={() => navigate('/tagpage')}
            className="flex flex-col items-center text-gray-400 font-black text-xs"
          >
            <span className="text-2xl">🔍</span>
            검색
          </button>

          <button
            onClick={() => navigate('/user')}
            className="flex flex-col items-center text-gray-400 font-black text-xs"
          >
            <span className="text-2xl">👤</span>
            마이
          </button>
        </div>
      </nav>

      {optionFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm shadow-2xl text-center">
            <div className="text-5xl mb-4">🍽️</div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">
              {optionFood.name}
            </h2>

            {!selectedAction ? (
              <>
                <p className="text-gray-500 mb-6 text-sm">
                  이 메뉴를 어떻게 진행할까요?
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCookOption}
                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black active:scale-95"
                  >
                    🍳 요리하기
                  </button>

                  <button
                    onClick={handleRestaurantOption}
                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-black active:scale-95"
                  >
                    📍 근처 식당 찾기
                  </button>

                  <button
                    onClick={closeOptionModal}
                    className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-6 text-sm">
                  어느 식사로 저장할까요?
                </p>

                <div className="mb-5">
                  <p className="text-xs text-gray-400 font-bold mb-2">
                    섭취량을 선택해주세요
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {[0.5, 1.0, 1.5, 2.0].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuantity(q)}
                        className={`py-2 rounded-xl text-xs font-black active:scale-95 ${
                          selectedQuantity === q
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {q}인분
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={() => handleMealTypeSelect("BREAKFAST")}
                    className="py-4 bg-yellow-50 text-yellow-600 rounded-2xl font-black active:scale-95"
                  >
                    🌅<br />아침
                  </button>

                  <button
                    onClick={() => handleMealTypeSelect("LUNCH")}
                    className="py-4 bg-orange-50 text-orange-600 rounded-2xl font-black active:scale-95"
                  >
                    ☀️<br />점심
                  </button>

                  <button
                    onClick={() => handleMealTypeSelect("DINNER")}
                    className="py-4 bg-purple-50 text-purple-600 rounded-2xl font-black active:scale-95"
                  >
                    🌙<br />저녁
                  </button>
                </div>

                <button
                  onClick={() => setSelectedAction(null)}
                  className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold"
                >
                  이전으로
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MainPage;