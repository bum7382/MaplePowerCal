// front/src/utils/toastContext.js
// 토스트 알림 컨텍스트
import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");

  const showToast = (msg, toastType = "success") => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    setTimeout(() => setVisible(false), 1500);
  };


  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, x: "-50%", y: -20 }}
            animate={{ opacity: 1, x: "-50%", y: 0 }}
            exit={{ opacity: 0, x: "-50%", y: -20 }}
            transition={{ duration: 0.4 }}
            className={`
              fixed top-40 left-1/2 transform -translate-x-1/2 z-[1000]
              px-6 py-3 rounded-lg shadow-lg font-galmuri text-base text-white
              ${type === "error" ? "bg-red-600" : "bg-[#44B7CF]"}
            `}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
