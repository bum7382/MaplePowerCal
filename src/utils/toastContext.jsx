// front/src/utils/toastContext.js
// 토스트 알림 컨텍스트
import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");

  const showToast = (msg, toastType = "success") => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <div
          className={`fixed top-40 left-1/2 transform -translate-x-1/2 z-[1000]
          px-6 py-3 rounded-lg shadow-lg font-morris text-base text-white
          transition-opacity duration-300
          ${type === "error" ? "bg-red-600" : "bg-[#44B7CF]"}`}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
