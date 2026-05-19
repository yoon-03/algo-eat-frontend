import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  // 초기 상태 설정
  const [formData, setFormData] = useState({ 
    gender: 'MALE', // 백엔드 Enum과 맞추기 위해 대문자 권장
    email: '', 
    password: '', 
    age: '', 
    height: '', 
    weight: '' 
  });

  // 모든 입력 필드의 변화를 감지하여 formData를 업데이트하는 함수
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 백엔드 회원가입 API 호출
      const response = await fetch("http://localhost:8080/api/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.text();
        console.log(result);
        alert("정보 등록 성공! 추천 페이지로 이동합니다.");
        navigate('/main'); 
      } else {
        alert("등록 실패: 이미 존재하는 이메일이거나 데이터 오류입니다.");
      }
    } catch (error) {
      console.error("백엔드 연결 에러:", error);
      alert("서버가 응답하지 않습니다. 백엔드 실행 여부를 확인하세요.");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-orange-600 italic tracking-tighter">알고<span className="text-orange-950">먹자</span></h1>
          <p className="mt-2 text-gray-500 font-medium text-sm">신체 데이터 기반 맞춤 메뉴 추천</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <input 
              name="email" // name 속성 추가
              type="email" 
              placeholder="이메일" 
              required 
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-400 focus:outline-none transition" 
            />
            <input 
              name="password" 
              type="password" 
              placeholder="비밀번호" 
              required 
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-400 focus:outline-none transition" 
            />
            <input 
              name="nickname" 
              type="text" 
              placeholder="별칭 (예 : 용감한호랑이)" 
              required 
              value={formData.nickname}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-400 focus:outline-none transition" 
            />  
          </div>
          
          <div className="flex gap-3">
            {['MALE', 'FEMALE'].map((g) => (
              <button 
                key={g} 
                type="button" 
                onClick={() => setFormData({...formData, gender: g})} 
                className={`flex-1 py-4 rounded-2xl font-bold transition ${formData.gender === g ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
              >
                {g === 'MALE' ? '남성' : '여성'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['age', 'height', 'weight'].map((field) => (
              <input 
                key={field} 
                name={field} // name 속성 추가
                type="number" 
                placeholder={field === 'age' ? '나이' : field === 'height' ? '키' : '무게'} 
                required 
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-400 focus:outline-none transition" 
              />
            ))}
          </div>
          <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl text-xl font-black hover:bg-orange-700 shadow-xl shadow-orange-100 transition">추천 받으러 가기 🚀</button>
        </form>
      </div>
    </div>
  );
}

export default Register;