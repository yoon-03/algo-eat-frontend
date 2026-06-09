import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TagPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const TEST_USER_ID = localStorage.getItem("userId") || 1;

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "안녕하세요! 먹고 싶은 메뉴를 자연스럽게 말해보세요. 예: 오늘은 가볍고 단백질 많은 음식 추천해줘"
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendedFoods, setRecommendedFoods] = useState([]);

  const [optionFood, setOptionFood] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1.0);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages(prev => [
      ...prev,
      { role: "user", text: userMessage }
    ]);

    setInput("");
    setLoading(true);
    setRecommendedFoods([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini 서버 오류:", response.status, errorText);
        throw new Error("Gemini 응답 실패");
      }

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: data.answer || "응답을 받지 못했어요."
        }
      ]);

      setRecommendedFoods(data.foods || []);
    } catch (error) {
      console.error("Gemini 호출 실패:", error);

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: "Gemini 연결에 실패했어요. 서버나 API Key를 확인해주세요."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveHistoryToDB = async (foodId, mealType, quantity = 1.0) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/history/${TEST_USER_ID}/${foodId}?mealType=${mealType}&quantity=${quantity}`,
        {
          method: "POST",
        }
      );

      console.log("Gemini 식단 저장 응답:", response.status);
      const text = await response.text();
      console.log("Gemini 식단 저장 응답 내용:", text);

      return response.ok;
    } catch (error) {
      console.error("Gemini 식단 저장 실패:", error);
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
      alert("식단 저장에 실패했습니다.");
      return false;
    }

    localStorage.setItem("lastSelectedFood", JSON.stringify(food));
    return true;
  };

  const handleMealTypeSelect = async (mealType) => {
    if (!optionFood || !selectedAction) return;

    const foodName = optionFood.name;
    const action = selectedAction;

    const saved = await saveSelectedFoodToCalendar(
      optionFood,
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
          selectedMenu: foodName,
        },
      });
    } else if (action === "restaurant") {
      navigate("/map", {
        state: {
          selectedMenu: foodName,
        },
      });
    }
  };

  const closeModal = () => {
    setOptionFood(null);
    setSelectedAction(null);
    setSelectedQuantity(1.0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans pb-28">
      <header className="sticky top-0 z-50 bg-[#faf7f2]/95 backdrop-blur px-5 pt-5 pb-4 border-b border-orange-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/main')}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 active:scale-95"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-xl font-black text-orange-600">
              AI 메뉴 상담
            </h1>
            <p className="text-[11px] text-gray-400 font-bold">
              Gemini에게 먹고 싶은 메뉴를 물어보세요
            </p>
          </div>

          <button
            onClick={() => {
              setMessages([
                {
                  role: "ai",
                  text: "대화를 초기화했어요. 어떤 메뉴가 끌리시나요?"
                }
              ]);
              setRecommendedFoods([]);
              closeModal();
            }}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 active:scale-95"
          >
            ↺
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">
        <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-orange-50">
          <h2 className="text-lg font-black text-gray-900">
            AI에게 메뉴 추천받기
          </h2>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            “매운 국물요리”, “다이어트용”, “든든한 한식”처럼 자유롭게 입력해보세요.
          </p>
        </section>

        <section className="space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-br-md"
                    : "bg-white text-gray-700 border border-orange-50 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-400 border border-orange-50 px-4 py-3 rounded-2xl rounded-bl-md text-sm shadow-sm">
                Gemini가 답변을 작성 중이에요...
              </div>
            </div>
          )}
        </section>

        {recommendedFoods.length > 0 && (
          <section className="space-y-3 mt-4">
            <h3 className="font-black text-gray-700">
              추천 메뉴
            </h3>

            {recommendedFoods.map(food => (
              <div
                key={food.foodId}
                onClick={() => setOptionFood(food)}
                className="bg-white rounded-3xl p-4 shadow-sm border border-orange-100 cursor-pointer active:scale-95"
              >
                <div className="flex gap-3">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                      🍲
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="font-black text-lg text-gray-900">
                      {food.name}
                    </h4>

                    <p className="text-sm text-gray-500">
                      {food.nation || "분류 없음"} · {food.type || "종류 없음"}
                    </p>

                    <p className="text-orange-500 font-black mt-2">
                      {food.calories ? `${food.calories} kcal` : "영양 정보 없음"}
                    </p>

                    <div className="flex gap-1 mt-2 text-[10px] text-gray-400 font-bold">
                      {food.ingredient && <span>#{food.ingredient}</span>}
                      {food.nation && <span>#{food.nation}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#faf7f2]/95 backdrop-blur border-t border-orange-100">
        <div className="max-w-md mx-auto px-4 py-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 오늘은 가볍고 고단백 메뉴 추천해줘"
            className="flex-1 bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-orange-100"
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm disabled:opacity-40 active:scale-95"
          >
            전송
          </button>
        </div>
      </div>

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
                    onClick={() => setSelectedAction("cook")}
                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black active:scale-95"
                  >
                    🍳 요리하기
                  </button>

                  <button
                    onClick={() => setSelectedAction("restaurant")}
                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-black active:scale-95"
                  >
                    📍 근처 식당 찾기
                  </button>

                  <button
                    onClick={closeModal}
                    className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-5 text-sm">
                  섭취량과 식사 시간을 선택해주세요.
                </p>

                <div className="mb-5">
                  <p className="text-xs text-gray-400 font-bold mb-2">
                    섭취량
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

export default TagPage;