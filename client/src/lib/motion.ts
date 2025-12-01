export const motionTokens = {
  spring: {
    snappy: { type: "spring", stiffness: 400, damping: 30 },
    bouncy: { type: "spring", stiffness: 300, damping: 20 },
    gentle: { type: "spring", stiffness: 200, damping: 25 },
  },
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
  ease: {
    smooth: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
  }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: motionTokens.duration.fast }
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: motionTokens.spring.snappy
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: motionTokens.spring.snappy
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: motionTokens.spring.gentle
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(6, 182, 212, 0)",
      "0 0 20px 5px rgba(6, 182, 212, 0.3)",
      "0 0 0 0 rgba(6, 182, 212, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: motionTokens.spring.snappy }
};
