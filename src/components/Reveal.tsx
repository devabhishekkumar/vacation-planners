'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.58, ease: [0.2, 0.8, 0.2, 1], delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
