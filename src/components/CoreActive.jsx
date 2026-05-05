import React from "react";
import { motion } from "framer-motion";

export default function CoreActive({ onClose, selectedCore }) {
  return (
    <>
      {/* 백드롭: 거의 즉시 깔림 → 뒤 컨텐츠 즉시 차단 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.05 }}
        className="fixed top-0 left-0 w-full h-full bg-black/80 z-[10000]"
      />

      {/* 모달 콘텐츠: 부드럽게 페이드인 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed top-0 left-0 w-full h-full z-[10001]"
      >
        {/* 헥사 메인 배경 */}
        <img
          src="/images/hexa/코어활성화배경.png"
          alt="헥사 메인 배경"
          className="absolute inset-0 w-[30%] h-auto m-auto"
          draggable={false}
        />
        <div className="relative inline-block select-none top-[23%] left-1/2 -translate-x-1/2 scale-[125%]">
          <span className="absolute top-[19%] left-1/2 -translate-x-1/2 z-10 font-galmuri text-white text-[7px]">
            0 0
          </span>

          {/* 코어.bg */}
          <img
            src="/images/hexa/코어.bg.png"
            alt="코어 슬롯"
            className="relative"
            draggable={false}
          />

          {/* 코어.active → bg랑 같은 위치에 겹치게 absolute */}
          <img
            src="/images/hexa/코어.active.png"
            alt="코어 슬롯 활성"
            className="absolute top-0 left-0 scale-[110%]"
            draggable={false}
          />

          {/* 헥사스탯 아이콘 */}
          <img
            src={`/images/hexa/헥사스탯${selectedCore}.disabled.png`}
            alt="코어 아이콘"
            className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2"
            draggable={false}
          />
        </div>

        {/* 활성화 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-[65.5%] right-[51%] custom-cursor"
        >
          <img
            src="/images/hexa/활성화하기.normal.png"
            alt="활성화하기"
            className="
              hover:content-[url('/images/hexa/활성화하기.hover.png')]
              active:content-[url('/images/hexa/활성화하기.pressed.png')]
            "
          />
        </button>

        {/* 취소 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-[65.5%] right-[43.5%] custom-cursor"
        >
          <img
            src="/images/hexa/취소.normal.png"
            alt="취소"
            className="
              hover:content-[url('/images/hexa/취소.hover.png')]
              active:content-[url('/images/hexa/취소.pressed.png')]
            "
          />
        </button>
      </motion.div>
    </>
  );
}
