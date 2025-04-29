import { useState } from "react";

export function CarouselMover(totalSemesters: number, viewCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = Math.max(0, totalSemesters - viewCount);

  const next = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return { currentIndex, next, prev, maxIndex };
}
