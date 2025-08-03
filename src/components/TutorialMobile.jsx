import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";

export default function TutorialMobile({onClose }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const totalSteps = 25;

  // 공통: 이벤트에서 x좌표 구하는 함수
  const getX = (e) => {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return e.clientX ?? 0;
  };
  

  const handleTouch = (e) => {
    const x = getX(e);
    const width = window.innerWidth;
    if (x < width / 2) {
      // 왼쪽: 이전
      if (step > 1) {
        setDirection(-1);
        setStep((s) => s - 1);
      }
    } else {
      // 오른쪽: 다음 (마지막이면 닫기)
      if (step < totalSteps) {
        setDirection(1);
        setStep((s) => s + 1);
      } else {
        onClose && onClose();
      }
    }
  };

  // swipe 이벤트 연결
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (step < totalSteps) {
        setDirection(1);
        setStep(s => s + 1);
      } else {
        onClose && onClose();
      }
    },
    onSwipedRight: () => {
      if (step > 1) {
        setDirection(-1);
        setStep(s => s - 1);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true // PC 마우스도 지원
  });

  // 애니메이션 설정
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute"
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative"
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      position: "absolute"
    })
  };


  return (
    <div
      {...handlers}
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center font-dotum"
      onClick={handleTouch}
      style={{ touchAction: "pan-y" }}
    >
      <div className="relative w-[95vw] h-[90vh] flex items-center justify-center overflow-hidden">
        <AnimatePresence custom={direction} initial={false}>
          <motion.img
            key={step}
            src={`/images/tutorial/모바일튜토리얼${step}.jpg`}
            alt={`튜토리얼${step}`}
            className="object-contain w-full h-full shadow-xl absolute left-0 top-0"
            draggable={false}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 500, damping: 40 },
              opacity: { duration: 0.2 }
            }}
          />
        </AnimatePresence>
      </div>
      {/* 단계표시 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-bold text-lg">
        {step} / {totalSteps}
      </div>
      {/* 닫기 버튼 */}
      <button
        className="absolute top-4 right-4 bg-white/70 rounded-full px-4 py-2 text-black text-[100%]"
        onClick={(e) => {
          e.stopPropagation();
          onClose && onClose();
        }}
      >
        닫기
      </button>
    </div>
  );
}
