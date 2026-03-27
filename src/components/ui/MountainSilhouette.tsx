export function MountainSilhouette() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0 h-24 sm:h-32 md:h-40">
      <svg
        viewBox="0 0 1440 320"
        className="w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back mountain layer */}
        <path
          d="M0,280 L120,220 L240,260 L360,180 L480,230 L600,160 L720,200 L840,140 L960,190 L1080,150 L1200,210 L1320,170 L1440,240 L1440,320 L0,320 Z"
          fill="rgba(30,41,59,0.5)"
          className="drop-shadow-[0_-2px_8px_rgba(56,189,248,0.08)]"
        />
        {/* Front mountain layer */}
        <path
          d="M0,300 L160,250 L320,280 L480,220 L640,270 L800,200 L960,260 L1120,230 L1280,270 L1440,250 L1440,320 L0,320 Z"
          fill="rgba(30,41,59,0.7)"
          className="drop-shadow-[0_-4px_12px_rgba(56,189,248,0.05)]"
        />
      </svg>
    </div>
  );
}
