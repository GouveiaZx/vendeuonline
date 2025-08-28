'use client';

import { useEffect, useRef, useState } from 'react';

// Hook para intersection observer
export function useInView(threshold = 0.1, once = true) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            setHasBeenInView(true);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, once]);

  return { ref, isInView: hasBeenInView || isInView };
}

// Hook para animações com delay
export function useDelayedAnimation(delay = 0) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isVisible;
}

// Hook para animação de números contadores
export function useCountUp(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = start + (end - start) * easeOutQuart;
      
      setCount(currentCount);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [start, end, duration, isActive]);

  return { count, startAnimation: () => setIsActive(true), isActive };
}

// Hook para animação typewriter
export function useTypewriter(text: string, speed = 50, delay = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let index = 0;

    const typeText = () => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
        timeoutId = setTimeout(typeText, speed);
      } else {
        setIsComplete(true);
      }
    };

    timeoutId = setTimeout(typeText, delay);

    return () => clearTimeout(timeoutId);
  }, [text, speed, delay]);

  return { displayText, isComplete };
}

// Hook para animação de scroll suave
export function useSmoothScroll() {
  const scrollTo = (elementId: string, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const targetPosition = element.offsetTop - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return { scrollTo, scrollToTop };
}

// Hook para detectar direção do scroll
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      
      if (direction !== scrollDirection && (currentScrollY - lastScrollY.current > 10 || currentScrollY - lastScrollY.current < -10)) {
        setScrollDirection(direction);
      }
      
      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', updateScrollDirection);
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [scrollDirection]);

  return { scrollDirection, scrollY };
}

// Hook para animação de hover 3D
export function useHover3D(intensity = 10) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return ref;
}

// Hook para animação de shake/vibração
export function useShake() {
  const [isShaking, setIsShaking] = useState(false);

  const shake = (duration = 500) => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), duration);
  };

  return { isShaking, shake };
}

// Hook para animação de ripple effect
export function useRipple() {
  const createRipple = (event: React.MouseEvent<HTMLElement>, color = 'rgba(255, 255, 255, 0.6)') => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
      background-color: ${color};
      left: ${x - 10}px;
      top: ${y - 10}px;
      width: 20px;
      height: 20px;
      pointer-events: none;
    `;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  return createRipple;
}

// Hook para animação sequencial de elementos
export function useSequentialAnimation<T extends HTMLElement>(
  itemsCount: number,
  delay = 100,
  duration = 300
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const refs = useRef<(T | null)[]>([]);

  const startAnimation = () => {
    setIsAnimating(true);
    setVisibleItems(new Set());

    for (let i = 0; i < itemsCount; i++) {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, i]));
        
        if (i === itemsCount - 1) {
          setTimeout(() => setIsAnimating(false), duration);
        }
      }, i * delay);
    }
  };

  const resetAnimation = () => {
    setVisibleItems(new Set());
    setIsAnimating(false);
  };

  return {
    visibleItems,
    isAnimating,
    startAnimation,
    resetAnimation,
    refs,
  };
}

// Hook para parallax effect
export function useParallax(speed = 0.5) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const windowHeight = window.innerHeight;

      // Check if element is in viewport
      if (scrolled + windowHeight > elementTop && scrolled < elementTop + elementHeight) {
        const yPos = -(scrolled - elementTop) * speed;
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}