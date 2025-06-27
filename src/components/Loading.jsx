// frontend/src/components/Loading.jsx
// 로딩 화면
import React, { useEffect, useState } from "react";

const frames = [
  "/images/loading/loading1.jpg",
  "/images/loading/loading2.jpg",
  "/images/loading/loading3.jpg",
  "/images/loading/loading4.jpg",
];

export default function Loading({ visible = true }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 200);
    return () => clearInterval(interval);
  }, []);


  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-500 pointer-events-none 
        ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <img
        src={`/images/loading/loading${frameIndex + 1}.jpg`}
        alt="로딩 중"
        className="w-screen h-screen object-cover"
      />
    </div>
  );
}
