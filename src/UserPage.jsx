import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("사용자");
  const [userId, setUserId] = useState(null);
  const [blacklistItems, setBlacklistItems] = useState([]);

  // 📅 캘린더 관련 상태
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [records, setRecords] = useState({});

  useEffect(() => {
    const savedNickname = localStorage.getItem("userNickname");
    const savedUserId = localStorage.getItem("userId");
    
    // "null" 방지 예외 처리
    if (savedNickname && savedNickname !== "null") setNickname(savedNickname);
    if (savedUserId && savedUserId !== "null") {
      setUserId(savedUserId);
      fetchBlacklist(savedUserId);
    }

    // 💾 로컬 스토리지에서 식단 기록(캘린더 데이터) 불러오기
    const savedRecords = localStorage.getItem("dietRecords");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    } else {
      // 기록이 아예 없으면 오늘 날짜 빈칸 생성
      setRecords({
        [new Date().getDate()]: {
          breakfast: { name: "", amount: 1, cal: 0 },
          lunch: { name: "", amount: 1, cal: 0 },
          dinner: { name: "", amount: 1, cal: 0 }
        }
      });
    }
  }, []);

  // ✅ 블랙리스트 목록 가져오기
  const fetchBlacklist = async (uid) => {
    try {
      const response = await fetch(`http://localhost:8080/api/user/${uid}/blacklist-items`);
      if(response.ok) {
         const data = await response.json();
         setBlacklistItems(data); 
      }
    } catch (error) {
      console.error("블랙리스트 로드 실패:", error);
    }
  };

  // ✅ 블랙리스트 해제
  const handleRemoveBlacklist = async (foodId) => {
    if (!window.confirm("이 음식을 다시 추천 목록에 포함할까요?")) return;
    try {
      await fetch(`http://localhost:8080/api/user/${userId}/blacklist/${foodId}`, { method: 'DELETE' });
      alert("차단이 해제되었습니다.");
      fetchBlacklist(userId); 
    } catch (error) {
      alert("해제 중 오류가 발생했습니다.");
    }
  };

  // 📝 캘린더 식단 수동 입력 및 변경 핸들러
  const handleInputChange = (type, field, value) => {
    setRecords(prev => {
      const dayData = prev[selectedDate] || {
        breakfast: { name: "", amount: 1, cal: 0 },
        lunch: { name: "", amount: 1, cal: 0 },
        dinner: { name: "", amount: 1, cal: 0 }
      };
      const updatedType = { ...dayData[type], [field]: value };

      // 칼로리 자동 가계산 (가상)
      if (field === 'name') updatedType.cal = value ? 500 : 0;
      if (field === 'amount') updatedType.cal = (dayData[type].cal / dayData[type].amount) * value;

      const newRecords = { ...prev, [selectedDate]: { ...dayData, [type]: updatedType } };
      
      // 변경될 때마다 로컬 스토리지에 즉시 덮어쓰기
      localStorage.setItem("dietRecords", JSON.stringify(newRecords)); 
      return newRecords;
    });
  };

  // 총 칼로리 계산
  const getTotalCal = (day) => {
    const dayData = records[day];
    if (!dayData) return 0;
    return (dayData.breakfast?.cal || 0) + (dayData.lunch?.cal || 0) + (dayData.dinner?.cal || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <nav className="bg-white border-b px-6 py-4 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate('/main')} className="text-2xl mr-4 text-gray-400 hover:text-orange-600 transition">←</button>
        <h1 className="text-xl font-black text-gray-800 italic">마이페이지</h1>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        
        {/* --- 프로필 섹션 --- */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm text-center border border-gray-100">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👤</div>
          <h2 className="text-2xl font-black text-gray-800 italic">테스트님</h2>
        </section>

        {/* --- 📅 캘린더 및 식단 기록 섹션 --- */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          {/* 날짜 선택 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <button 
                onClick={() => setSelectedDate(prev => prev > 1 ? prev - 1 : 1)}
                className="w-10 h-10 bg-gray-50 rounded-full text-gray-500 hover:bg-orange-100 hover:text-orange-600 font-bold"
            >
                &lt;
            </button>
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 italic">5월 {selectedDate}일 식단 📝</h3>
              <p className="text-sm text-gray-400 font-semibold mt-1">총 {getTotalCal(selectedDate).toFixed(0)} kcal / 2000 kcal</p>
            </div>
            <button 
                onClick={() => setSelectedDate(prev => prev < 31 ? prev + 1 : 31)}
                className="w-10 h-10 bg-gray-50 rounded-full text-gray-500 hover:bg-orange-100 hover:text-orange-600 font-bold"
            >
                &gt;
            </button>
          </div>

          {/* 식단 입력 폼 */}
          <div className="space-y-4">
            {['breakfast', 'lunch', 'dinner'].map((type) => (
              <div key={type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="w-12 text-center text-sm font-bold text-gray-500">
                  {type === 'breakfast' ? '아침' : type === 'lunch' ? '점심' : '저녁'}
                </div>
                <input 
                  type="text" 
                  placeholder="음식명을 입력하세요" 
                  value={records[selectedDate]?.[type]?.name || ""} 
                  onChange={(e) => handleInputChange(type, 'name', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-orange-400 bg-white"
                />
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2">
                    <input 
                    type="number" min="0.5" step="0.5" 
                    value={records[selectedDate]?.[type]?.amount || 1} 
                    onChange={(e) => handleInputChange(type, 'amount', parseFloat(e.target.value))}
                    className="w-12 py-2 text-sm text-center outline-none"
                    />
                    <span className="text-xs text-gray-400">인분</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 🚫 블랙리스트 섹션 --- */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-xl font-black text-gray-900 italic">내 블랙리스트 🚫</h3>
            <p className="text-xs text-gray-400 mt-1">다시 추천받고 싶은 음식은 X 버튼을 눌러주세요.</p>
          </div>

          <div className="space-y-3">
            {blacklistItems.length > 0 ? (
              blacklistItems.map((food) => (
                <div key={food.foodId} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-orange-50 transition">
                  <div className="flex items-center gap-4">
                    {food.imageUrl ? (
                      <img src={food.imageUrl} alt={food.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">🍲</div>
                    )}
                    <div>
                      <span className="font-bold text-gray-800">{food.name}</span>
                      <div className="flex gap-1">
                        <span className="text-[9px] text-gray-400">#{food.nation}</span>
                        <span className="text-[9px] text-gray-400">#{food.ingredient}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveBlacklist(food.foodId)}
                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-white rounded-full transition"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                아직 등록된 블랙리스트가 없습니다. 😊
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

export default UserPage;