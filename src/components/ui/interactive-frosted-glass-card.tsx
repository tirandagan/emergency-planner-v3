import React, { useRef, useEffect } from 'react';

interface FrostedGlassCardProps {
  children?: React.ReactNode;
  className?: string;
}

export const FrostedGlassCard: React.FC<FrostedGlassCardProps> = ({ 
  children, 
  className = '' 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * 5;
      const rotateX = ((y - centerY) / centerY) * -5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="card-container" style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        className={`transition-transform duration-200 ease-out ${className}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
};

interface TestimonialCardProps {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
  delay?: string;
}

export const InteractiveFrostedTestimonial: React.FC<TestimonialCardProps> = ({
  avatarSrc,
  name,
  handle,
  text,
  delay = ''
}) => {
  return (
    <FrostedGlassCard
      className={`${delay} flex items-start gap-3 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/30 dark:border-slate-700/30 p-5 w-64 shadow-2xl pointer-events-auto`}
    >
      <img src={avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium text-foreground">{name}</p>
        <p className="text-muted-foreground">{handle}</p>
        <p className="mt-1 text-foreground/80">{text}</p>
      </div>
    </FrostedGlassCard>
  );
};


