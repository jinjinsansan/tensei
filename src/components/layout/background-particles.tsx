const PARTICLE_COUNT = 14;

const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
  id: `particle-${index}`,
  delay: `${Math.random() * 6}s`,
  duration: `${8 + Math.random() * 6}s`,
  left: `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 4}px`,
}));

export function BackgroundParticles() {
  return (
    <div className="library-particles" aria-hidden>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="library-particle"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}
