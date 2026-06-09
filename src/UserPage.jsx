import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [nickname, setNickname] = useState("사용자");
  const [userId, setUserId] = useState(null);
  const [blacklistItems, setBlacklistItems] = useState([]);
  const [preference, setPreference] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [records, setRecords] = useState({});

  const emptyDayRecord = {
    breakfast: { historyId: null, name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 },
    lunch: { historyId: null, name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 },
    dinner: { historyId: null, name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 }
  };

  useEffect(() => {
    const savedNickname = localStorage.getItem("userNickname");
    const savedUserId = localStorage.getItem("userId");

    if (savedNickname && savedNickname !== "null") {
      setNickname(savedNickname);
    }

    if (savedUserId && savedUserId !== "null") {
      setUserId(savedUserId);
      fetchBlacklist(savedUserId);
      fetchPreference(savedUserId);
      fetchHistory(savedUserId);
    } else {
      setRecords({
        [new Date().getDate()]: emptyDayRecord
      });
    }
  }, []);

  const fetchBlacklist = async (uid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${uid}/blacklist-items`);

      if (response.ok) {
        const data = await response.json();
        setBlacklistItems(data);
      }
    } catch (error) {
      console.error("블랙리스트 로드 실패:", error);
    }
  };

  const fetchPreference = async (uid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${uid}/preference`);

      if (response.ok) {
        const data = await response.json();
        setPreference(data);
      }
    } catch (error) {
      console.error("선호도 로드 실패:", error);
    }
  };

  const fetchHistory = async (uid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${uid}`);

      if (!response.ok) {
        throw new Error("식단 기록 로드 실패");
      }

      const data = await response.json();
      const convertedRecords = {};

      data.forEach((item) => {
        console.log("History Item:", item);

        const date = new Date(item.eatDate).getDate();
        const mealType = item.mealType?.toLowerCase() || "dinner";
        const food = item.food;
        const quantity = Number(item.quantity) || 1;

        if (!convertedRecords[date]) {
          convertedRecords[date] = {
            breakfast: { historyId: null, name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 },
            lunch: { historyId: null, name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 },
            dinner: { historyId: null, name: "", amount: 1, cal: 0, carbs: 0, protein: 0, fat: 0 }
          };
        }

        convertedRecords[date][mealType] = {
          historyId: item.historyId,
          name: food?.name || "",
          amount: quantity,
          cal: (Number(food?.calories) || 0) * quantity,
          carbs: (Number(food?.carbs) || 0) * quantity,
          protein: (Number(food?.protein) || 0) * quantity,
          fat: (Number(food?.fat) || 0) * quantity
        };
      });

      if (Object.keys(convertedRecords).length === 0) {
        convertedRecords[new Date().getDate()] = emptyDayRecord;
      }

      setRecords(convertedRecords);
      localStorage.setItem("dietRecords", JSON.stringify(convertedRecords));
    } catch (error) {
      console.error("DB 식단 기록 로드 실패:", error);
      setRecords({
        [new Date().getDate()]: emptyDayRecord
      });
    }
  };

  const updateHistoryQuantity = async (historyId, quantity) => {
    if (!historyId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/history/${historyId}?quantity=${quantity}`,
        {
          method: "PUT",
        }
      );

      console.log("식단 수량 수정 응답:", response.status);
    } catch (error) {
      console.error("식단 수량 수정 실패:", error);
    }
  };

  const deleteHistory = async (historyId, type) => {
    if (!historyId) return;

    if (!window.confirm("이 식단 기록을 삭제할까요?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${historyId}`, {
        method: "DELETE",
      });

      console.log("식단 삭제 응답:", response.status);

      setRecords(prev => {
        const dayData = prev[selectedDate] || emptyDayRecord;

        const newRecords = {
          ...prev,
          [selectedDate]: {
            ...dayData,
            [type]: {
              historyId: null,
              name: "",
              amount: 1,
              cal: 0,
              carbs: 0,
              protein: 0,
              fat: 0
            }
          }
        };

        localStorage.setItem("dietRecords", JSON.stringify(newRecords));
        return newRecords;
      });
    } catch (error) {
      console.error("식단 삭제 실패:", error);
    }
  };

  const handleRemoveBlacklist = async (foodId) => {
    if (!window.confirm("이 음식을 다시 추천 목록에 포함할까요?")) return;

    try {
      await fetch(`${API_BASE_URL}/api/user/${userId}/blacklist/${foodId}`, {
        method: 'DELETE'
      });

      alert("차단이 해제되었습니다.");
      fetchBlacklist(userId);
    } catch (error) {
      alert("해제 중 오류가 발생했습니다.");
    }
  };

  const handleInputChange = (type, field, value) => {
    setRecords(prev => {
      const dayData = prev[selectedDate] || emptyDayRecord;

      const updatedType = {
        ...dayData[type],
        [field]: value
      };

      if (field === 'name') {
        updatedType.cal = value ? 500 : 0;
        updatedType.carbs = value ? 70 : 0;
        updatedType.protein = value ? 20 : 0;
        updatedType.fat = value ? 15 : 0;
      }

      if (field === 'amount') {
        const oldAmount = Number(dayData[type].amount) || 1;
        const newAmount = Number(value) || 1;

        const baseCal = (Number(dayData[type].cal) || 0) / oldAmount;
        const baseCarbs = (Number(dayData[type].carbs) || 0) / oldAmount;
        const baseProtein = (Number(dayData[type].protein) || 0) / oldAmount;
        const baseFat = (Number(dayData[type].fat) || 0) / oldAmount;

        updatedType.amount = newAmount;
        updatedType.cal = baseCal * newAmount;
        updatedType.carbs = baseCarbs * newAmount;
        updatedType.protein = baseProtein * newAmount;
        updatedType.fat = baseFat * newAmount;

        updateHistoryQuantity(dayData[type].historyId, newAmount);
      }

      const newRecords = {
        ...prev,
        [selectedDate]: {
          ...dayData,
          [type]: updatedType
        }
      };

      localStorage.setItem("dietRecords", JSON.stringify(newRecords));
      return newRecords;
    });
  };

  const getTotalCal = (day) => {
    const dayData = records[day];
    if (!dayData) return 0;

    return (
      (Number(dayData.breakfast?.cal) || 0) +
      (Number(dayData.lunch?.cal) || 0) +
      (Number(dayData.dinner?.cal) || 0)
    );
  };

  const getNutritionSummary = (day) => {
    const dayData = records[day];

    if (!dayData) {
      return { carbs: 0, protein: 0, fat: 0 };
    }

    return {
      carbs:
        (Number(dayData.breakfast?.carbs) || 0) +
        (Number(dayData.lunch?.carbs) || 0) +
        (Number(dayData.dinner?.carbs) || 0),

      protein:
        (Number(dayData.breakfast?.protein) || 0) +
        (Number(dayData.lunch?.protein) || 0) +
        (Number(dayData.dinner?.protein) || 0),

      fat:
        (Number(dayData.breakfast?.fat) || 0) +
        (Number(dayData.lunch?.fat) || 0) +
        (Number(dayData.dinner?.fat) || 0),
    };
  };

  const getTopPreference = (data) => {
    if (!data || Object.keys(data).length === 0) return null;

    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])[0];
  };

  const renderPreferenceGroup = (title, emoji, data) => {
    const entries = data
      ? Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 3)
      : [];

    return (
      <div className="bg-orange-50 rounded-3xl p-4 border border-orange-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{emoji}</span>
          <p className="font-black text-sm text-gray-800">{title}</p>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map(([name, count]) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">{name}</span>
                <span className="text-orange-600 font-black">{count}회</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">아직 데이터가 없어요</p>
        )}
      </div>
    );
  };

  const topNation = getTopPreference(preference.nation);
  const topTaste = getTopPreference(preference.taste);
  const nutrition = getNutritionSummary(selectedDate);

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans pb-28">
      <header className="sticky top-0 z-40 bg-[#faf7f2]/95 backdrop-blur px-5 pt-5 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-orange-600 italic tracking-tighter">
              마이페이지
            </h1>
            <p className="text-xs text-gray-400 font-bold mt-1">
              나의 식단과 추천 취향 관리
            </p>
          </div>

          <button
            onClick={() => navigate('/main')}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 active:scale-95"
          >
            ←
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 space-y-5">
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-orange-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-3xl">
              👤
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {nickname}님
              </h2>
              <p className="text-xs text-gray-400 font-bold mt-1">
                사용자 ID {userId || "-"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-bold">가장 선호 국가</p>
              <p className="text-lg font-black text-gray-800 mt-1">
                {topNation ? topNation[0] : "분석 전"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-bold">가장 선호 맛</p>
              <p className="text-lg font-black text-gray-800 mt-1">
                {topTaste ? topTaste[0] : "분석 전"}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-orange-50">
          <div className="mb-5">
            <h3 className="text-xl font-black text-gray-900">
              내 취향 분석 ❤️
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              선택한 메뉴를 바탕으로 선호도를 분석해요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {renderPreferenceGroup("선호 국가", "🌏", preference.nation)}
            {renderPreferenceGroup("선호 종류", "🍽️", preference.type)}
            {renderPreferenceGroup("선호 재료", "🥩", preference.ingredient)}
            {renderPreferenceGroup("선호 맛", "✨", preference.taste)}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-orange-50">
          <div className="flex justify-between items-center mb-5">
            <button
              onClick={() => setSelectedDate(prev => prev > 1 ? prev - 1 : 1)}
              className="w-10 h-10 bg-gray-50 rounded-full text-gray-500 font-black active:scale-95"
            >
              &lt;
            </button>

            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900">
                5월 {selectedDate}일 식단
              </h3>
              <p className="text-xs text-orange-500 font-black mt-1">
                총 {getTotalCal(selectedDate).toFixed(0)} kcal
              </p>
            </div>

            <button
              onClick={() => setSelectedDate(prev => prev < 31 ? prev + 1 : 31)}
              className="w-10 h-10 bg-gray-50 rounded-full text-gray-500 font-black active:scale-95"
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 font-bold">탄수화물</p>
              <p className="font-black text-orange-600">
                {nutrition.carbs.toFixed(0)}g
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 font-bold">단백질</p>
              <p className="font-black text-blue-600">
                {nutrition.protein.toFixed(0)}g
              </p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 font-bold">지방</p>
              <p className="font-black text-yellow-600">
                {nutrition.fat.toFixed(0)}g
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {['breakfast', 'lunch', 'dinner'].map((type) => (
              <div
                key={type}
                className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3"
              >
                <div className="w-12 text-center text-sm font-black text-orange-500">
                  {type === 'breakfast' ? '아침' : type === 'lunch' ? '점심' : '저녁'}
                </div>

                <input
                  type="text"
                  placeholder="음식명"
                  value={records[selectedDate]?.[type]?.name || ""}
                  onChange={(e) => handleInputChange(type, 'name', e.target.value)}
                  className="flex-1 bg-white px-3 py-2 rounded-xl text-sm outline-none border border-gray-100"
                />

                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={records[selectedDate]?.[type]?.amount || 1}
                  onChange={(e) =>
                    handleInputChange(type, 'amount', parseFloat(e.target.value))
                  }
                  className="w-14 bg-white px-2 py-2 rounded-xl text-sm text-center outline-none border border-gray-100"
                />

                <button
                  onClick={() =>
                    deleteHistory(
                      records[selectedDate]?.[type]?.historyId,
                      type
                    )
                  }
                  disabled={!records[selectedDate]?.[type]?.historyId}
                  className="w-8 h-8 rounded-full bg-white text-gray-300 hover:text-red-500 font-black disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-orange-50">
          <div className="mb-5">
            <h3 className="text-xl font-black text-gray-900">
              내 블랙리스트 🚫
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              추천에서 제외한 음식 목록이에요.
            </p>
          </div>

          <div className="space-y-3">
            {blacklistItems.length > 0 ? (
              blacklistItems.map((food) => (
                <div
                  key={food.foodId}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    {food.imageUrl ? (
                      <img
                        src={food.imageUrl}
                        alt={food.name}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center">
                        🍲
                      </div>
                    )}

                    <div>
                      <p className="font-black text-gray-800 text-sm">
                        {food.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        #{food.nation} #{food.ingredient}
                      </p>
                      <p className="text-[10px] text-orange-500 font-black">
                        {food.calories ? `${food.calories} kcal` : "영양 정보 없음"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveBlacklist(food.foodId)}
                    className="w-8 h-8 rounded-full bg-white text-gray-300 hover:text-red-500 font-black"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm font-bold">
                아직 등록된 블랙리스트가 없습니다 😊
              </div>
            )}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto bg-white border-t shadow-2xl rounded-t-[2rem] px-8 py-3 flex justify-between">
          <button
            onClick={() => navigate('/main')}
            className="flex flex-col items-center text-gray-400 font-black text-xs"
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
            className="flex flex-col items-center text-orange-500 font-black text-xs"
          >
            <span className="text-2xl">👤</span>
            마이
          </button>
        </div>
      </nav>
    </div>
  );
}

export default UserPage;