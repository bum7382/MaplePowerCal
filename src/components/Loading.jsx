import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const frames = [
  "/images/loading/loading1.jpg",
  "/images/loading/loading2.jpg",
  "/images/loading/loading3.jpg",
  "/images/loading/loading4.jpg",
  "/images/loading/loading5.jpg"
];

export default function Loading({ visible = true }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [forward, setForward] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        if (forward) {
          if (prev === frames.length - 1) {
            setForward(false);
            return prev - 1;
          }
          return prev + 1;
        } else {
          if (prev === 0) {
            setForward(true);
            return prev + 1;
          }
          return prev - 1;
        }
      });
    }, 200);
    return () => clearInterval(interval);
  }, [forward]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={frames[frameIndex]}
            alt="로딩 중"
            className="w-screen h-screen object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
