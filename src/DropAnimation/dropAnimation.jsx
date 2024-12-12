import React, { useEffect, useRef } from 'react';
import './dropAnimation.css';

const DropAnimation = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    const createCircle = () => {
      const circle = document.createElement('div');
      circle.classList.add('circle');

      const rect = container.getBoundingClientRect();
      const size = Math.random() * 100 + 20;
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      const blur = 0.4;

      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;

      if (blur) {
        circle.classList.add('blurred');
      }

      container.appendChild(circle);
      animateCircle(circle);
    };

    const animateCircle = (circle) => {
      const animationDuration = Math.random() * 5 + 2;
      circle.style.animation = `pulse ${animationDuration}s infinite`;
    };

    for (let i = 0; i < 15; i++) {
      createCircle();
    }
  }, []);

  return <div className="animation-container" ref={containerRef}></div>;
};

export default DropAnimation;
