import React, {useEffect, useState} from "react";
import {tutorialScripts} from "../data/scripts.js"

function TypingText({ text, speed = 60, skip, onDone }) {
  const [displayed, setDisplayed] = useState(""); // 화면에 보여줄 글자
  const [index, setIndex] = useState(0);          // 현재 인덱스
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayed(""); // 새 텍스트 올 때 초기화
    setIndex(0);
    setIsDone(false);
  }, [text]); // text가 바뀔 때마다 리셋

  // 타이핑 애니메이션
  useEffect(() => {
    if (skip && !isDone) {
      setDisplayed(text);
      setIndex(text.length);
      setIsDone(true);
      onDone && onDone();
      return;
    }
    if (index < text.length && !skip) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (index >= text.length && !isDone) {
      setIsDone(true);
      onDone && onDone();
    }
  }, [index, text, speed, skip, isDone, onDone]);

  return <span>{displayed}</span>;
}


export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0); // 현재 장면
  const [line, setLine] = useState(0); // 현재 대사(한 장면 내)
  const [typingDone, setTypingDone] = useState(false);
  const [skipTyping, setSkipTyping] = useState(false);

  // 헥사 창과 동일하게 1920x945 디자인 박스 기준으로 판 전체를 통째로 스케일한다.
  const DESIGN_W = 1920;
  const DESIGN_H = 945;
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => setScale(Math.min(1, window.innerWidth / DESIGN_W));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const script = tutorialScripts[step];
  const lastLine = line === script.texts.length - 1;
  const lastStep = step === tutorialScripts.length - 1;

  // 엔터 키 작동 가능
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [typingDone, step, line, skipTyping]);

  // 이전 버튼 핸들러
  const handlePrev = () => {
    if (line > 0) {
      setLine(line - 1);
      setTypingDone(false);
      setSkipTyping(false);
    } else if (step > 0) {
      setStep(step - 1);
      setLine(tutorialScripts[step - 1].texts.length - 1);
      setTypingDone(false);
      setSkipTyping(false);
    }
  };

  // 다음 버튼 핸들러
  const handleNext = () => {
    if (!typingDone) {
      setSkipTyping(true); // 아직 타이핑 중이면 한 번에 다 보여줌
      return;
    }
    if (!lastLine) {
      setLine(line + 1);
      setTypingDone(false);
      setSkipTyping(false);
    } else if (!lastStep) {
      setStep(step + 1);
      setLine(0);
      setTypingDone(false);
      setSkipTyping(false);
    } else {
      onClose && onClose();
    }
  };

  // 텍스트/스텝/라인이 바뀔 때마다 skip/typingDone 초기화
  useEffect(() => {
    setSkipTyping(false);
    setTypingDone(false);
  }, [step, line]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
    {/* 1920x945 고정 디자인 박스: 중앙 배치 + 가로 기준 스케일로 통째 스케일 */}
    <div
      draggable="false"
      className="absolute left-1/2 top-1/2"
      style={{
        width: DESIGN_W,
        height: DESIGN_H,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* 튜토리얼 배경 이미지 */}
      <img
        src={script.image}
        alt={`튜토리얼${step + 1}`}
        className="absolute top-0 left-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* 대화창 */}
      <img
        src="/images/tutorial/대화창.png"
        alt="대화창"
        className="absolute top-[110px] left-[210px] w-[1500px]"
        draggable={false}
      />
      {/* 대사 텍스트 */}
      <div className="absolute top-[785px] left-[470px] w-[750px] max-w-xl text-white text-[20px] font-dotum text-left">
        <TypingText
          key={`${step}-${line}`}
          text={script.texts[line]}
          speed={20}
          skip={skipTyping}
          onDone={() => setTypingDone(true)}
        />
      </div>
      {/* 이전 버튼 */}
      <button
        onClick={handlePrev}
        disabled={step === 0 && line === 0}
        className="
          absolute bottom-[10px] left-[1030px]
          w-[55px] flex items-center justify-center
          bg-transparent border-none shadow-none outline-none
          cursor-pointer p-0 m-0
          disabled:opacity-40 disabled:cursor-not-allowed
          transition duration-150 hover:brightness-125 active:brightness-75
        "
        tabIndex={-1}
        aria-label="이전"
        style={{ zIndex: 10 }}
      >
        <img src="/images/tutorial/이전.png" alt="이전" className="w-full h-full object-contain" draggable={false} />
      </button>
      {/* 다음/확인 버튼 */}
      <button
        onClick={handleNext}
        className="
          absolute bottom-[10px] right-[760px]
          w-[55px] flex items-center justify-center
          bg-transparent border-none shadow-none outline-none
          cursor-pointer p-0 m-0
          disabled:opacity-40 disabled:cursor-not-allowed
          transition duration-150 hover:brightness-125 active:brightness-75
        "
        tabIndex={-1}
        aria-label="다음"
        style={{ zIndex: 10 }}
      >
        {lastStep && lastLine ? (
          <img src="/images/tutorial/확인.png" alt="확인" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <img src="/images/tutorial/다음.png" alt="다음" className="w-full h-full object-contain" draggable={false} />
        )}
      </button>
      <button 
        onClick = {onClose}
        className="absolute bottom-[190px] left-[390px] 
          w-[30px] h-[30px]
          text-center text-bold
          rounded-full bg-black/40
          text-white text-[13px] font-bold
          hover:bg-black/70 active:bg-black/80
          transition z-[10000]"
        tabIndex={-1}
      >
        ✕
      </button>
    </div>
    </div>
  );
}
