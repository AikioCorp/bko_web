"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./ScrollingTitle.module.css";

export function ScrollingTitle({ title, className = "" }: { title: string; className?: string }) {
  const container = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (container.current && text.current) {
        setOverflow(Math.max(0, text.current.scrollWidth - container.current.clientWidth));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (container.current) observer.observe(container.current);
    if (text.current) observer.observe(text.current);
    return () => observer.disconnect();
  }, [title]);

  const style = {
    "--title-distance": `-${overflow}px`,
    "--title-duration": `${Math.max(6, overflow / 25 + 4)}s`,
  } as CSSProperties;

  return (
    <span ref={container} title={title} className={`${styles.container} ${className}`} style={style}>
      <span ref={text} key={title} className={`${styles.text} ${overflow > 1 ? styles.scrolling : ""}`}>
        {title}
      </span>
    </span>
  );
}
