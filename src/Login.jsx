import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      console.log("API_BASE_URL:", API_BASE_URL);

      const response = await fetch(`${API_BASE_URL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const result = await response.text();

      console.log("로그인 status:", response.status);
      console.log("로그인 응답:", result);

      if (response.ok) {

        const parts = result.split(",");

        const userId = parts[1] || 1;
        const nickname = parts[2] || "사용자";

        localStorage.setItem("userId", userId);
        localStorage.setItem("userNickname", nickname);

        alert("로그인 성공!");

        navigate("/main");

      } else {

        alert(`로그인 실패: ${result}`);

      }

    } catch (error) {

      console.error("로그인 에러:", error);
      alert("서버 연결 실패!");

    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-orange-600 italic tracking-tighter">
            알고잇
          </h1>

          <p className="mt-2 text-gray-500 font-medium">
            오신 것을 환영합니다!
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          <input
            type="email"
            placeholder="이메일"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-400 focus:outline-none transition"
          />

          <input
            type="password"
            placeholder="비밀번호"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-400 focus:outline-none transition"
          />

          <button
            type="submit"
            className="w-full py-5 bg-orange-600 text-white rounded-2xl text-xl font-black hover:bg-orange-700 shadow-xl transition"
          >
            로그인 🚀
          </button>

        </form>

        <div className="mt-8 text-center">
          <span className="text-gray-400">
            계정이 없으신가요?
          </span>

          <button
            onClick={() => navigate('/Register')}
            className="ml-2 text-orange-600 font-bold hover:underline"
          >
            회원가입
          </button>
        </div>

      </div>

    </div>
  );
}

export default Login;