import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};


function MapPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedMenu = location.state?.selectedMenu || "음식";

  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

const defaultCenter = {
  lat: 37.4481,
  lng: 126.6570,
};

  const searchKeyword = useMemo(() => {
    return `${selectedMenu} 맛집`;
  }, [selectedMenu]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log("위치 성공:", position);

    setUserLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  },
  (error) => {
    console.log("위치 실패:", error);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
);
  }, []);

  useEffect(() => {
    if (!isLoaded || !map || !userLocation) return;

    const service = new window.google.maps.places.PlacesService(map);

    service.nearbySearch(
      {
        location: userLocation,
        radius: 2000,
        keyword: searchKeyword,
        type: "restaurant",
      },
      (results, status) => {
        console.log("검색어:", searchKeyword);
        console.log("검색 상태:", status);
        console.log("검색 결과:", results);

        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setRestaurants(results || []);
        } else {
          setRestaurants([]);
        }
      }
    );
  }, [isLoaded, map, userLocation, searchKeyword]);

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((position) => {
      const current = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setUserLocation(current);
      map?.panTo(current);
      map?.setZoom(15);
    });
  };

  if (loadError) {
    return <div className="p-6">지도를 불러오는 중 오류가 발생했습니다.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center font-black text-orange-500">
        지도 로딩 중...
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#faf7f2] font-sans flex flex-col overflow-hidden">
      <header className="bg-[#faf7f2]/95 backdrop-blur px-5 pt-5 pb-4 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 active:scale-95"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-xl font-black text-gray-900">
              주변 식당 찾기
            </h1>
            <p className="text-xs text-orange-500 font-black mt-1">
              {selectedMenu} 맛집 검색 중
            </p>
          </div>

          <button
            onClick={moveToCurrentLocation}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-lg active:scale-95"
          >
            🎯
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userLocation}
          zoom={15}
          onLoad={(mapInstance) => setMap(mapInstance)}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          <Marker
            position={userLocation}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />

          {restaurants.map((restaurant) => (
            <Marker
              key={restaurant.place_id}
              position={{
                lat: restaurant.geometry.location.lat(),
                lng: restaurant.geometry.location.lng(),
              }}
              onClick={() => setSelectedRestaurant(restaurant)}
            />
          ))}

          {selectedRestaurant && (
            <InfoWindow
              position={{
                lat: selectedRestaurant.geometry.location.lat(),
                lng: selectedRestaurant.geometry.location.lng(),
              }}
              onCloseClick={() => setSelectedRestaurant(null)}
            >
              <div className="p-1">
                <h3 className="font-bold text-sm">{selectedRestaurant.name}</h3>
                <p className="text-xs text-gray-600">
                  ⭐ {selectedRestaurant.rating || "평점 없음"}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="max-w-md mx-auto bg-white rounded-3xl px-5 py-4 shadow-lg border border-orange-50">
            <p className="text-xs text-gray-400 font-bold">현재 검색어</p>
            <p className="text-lg font-black text-gray-900 mt-1">
              {searchKeyword}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 pb-5">
          <div className="max-w-md mx-auto px-4">
            {restaurants.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-orange-50">
                <h4 className="text-lg font-black text-gray-900">
                  주변 식당을 찾지 못했어요
                </h4>
                <p className="text-sm text-gray-400 mt-2">
                  검색 범위를 넓히거나 다른 메뉴를 선택해보세요.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {restaurants.map((shop) => (
                  <div
                    key={shop.place_id}
                    onClick={() => {
                      setSelectedRestaurant(shop);
                      map?.panTo({
                        lat: shop.geometry.location.lat(),
                        lng: shop.geometry.location.lng(),
                      });
                    }}
                    className="min-w-[280px] bg-white rounded-[2rem] p-5 shadow-2xl border border-orange-50 active:scale-95 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl">
                        🍽️
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between gap-2">
                          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            {selectedMenu}
                          </span>
                          <span className="text-xs text-gray-400 font-bold">
                            주변
                          </span>
                        </div>

                        <h4 className="text-lg font-black text-gray-900 mt-2 line-clamp-1">
                          {shop.name}
                        </h4>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-orange-500 text-sm font-black">
                            ⭐ {shop.rating || "없음"}
                          </span>
                          <span className="text-gray-300 text-xs font-bold">
                            리뷰 {shop.user_ratings_total || 0}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                          {shop.vicinity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;