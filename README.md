# 🍽️ AI Menu Recommendation Project

사용자의 취향, 상황, 기피 음식 등을 반영하여 맞춤형 메뉴를 추천하는 AI 기반 메뉴 추천 애플리케이션입니다.

---

# 📌 Project Overview

기존 랜덤 음식 추천 서비스의 단점을 개선하고,  
사용자의 선호도와 조건을 반영한 개인화 추천 시스템 구현을 목표로 합니다.

단순 랜덤 추천이 아닌:

- 선호 음식 반영
- 블랙리스트 제외
- 상황 기반 추천
- AI 추천 로직 적용
- 추천 결과 저장

등의 기능을 제공합니다.

---

# 🛠 Tech Stack

## Frontend
- React
- JavaScript
- Axios
- CSS

## Backend
- Spring Boot
- Java
- JPA / Hibernate
- REST API

## Database
- MySQL

## AI / Recommendation
- Python
- TensorFlow / Scikit-learn
- 음식 데이터 기반 추천 로직

---

# ✨ Main Features

## 👤 User System
- 회원가입 / 로그인
- 사용자 정보 관리

## 🍱 Menu Recommendation
- 음식 랜덤 추천
- AI 기반 맞춤 추천
- 선호도 반영 추천

## 🚫 BlackList System
- 원하지 않는 음식 제외
- 추천 결과 필터링

## 📅 Calendar
- 추천 음식 기록 저장
- 날짜별 식단 확인

## 🖼 UI/UX
- 음식 이미지 제공
- 직관적인 메뉴 카드 UI
- 애니메이션 효과 적용 예정

---

# 🧠 Recommendation Logic

사용자의:

- 선호 음식
- 기피 음식
- 이전 선택 데이터
- 음식 카테고리

등을 기반으로 추천 결과를 생성합니다.

향후:
- 협업 필터링
- 딥러닝 기반 추천
- 사용자 행동 분석

기능 추가 예정입니다.

---

# 📂 Project Structure

```bash
Frontend/
 ┣ src/
 ┣ components/
 ┣ pages/
 ┗ api/

Backend/
 ┣ controller/
 ┣ service/
 ┣ repository/
 ┣ entity/
 ┗ config/

AI/
 ┣ model/
 ┣ dataset/
 ┗ training/
