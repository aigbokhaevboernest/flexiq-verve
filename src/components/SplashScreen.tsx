import { useEffect, useState } from "react";

type SplashProps = {
  /**
   * When true the splash stays on screen until the parent unmounts it
   * (e.g. GuestOnly while the session check is still running).
   * When false (default) it plays once and fades out by itself, like at app start.
   */
  hold?: boolean;
  /** How long to stay before fading out once not held. Default 650ms (the original timing). */
  exitDelay?: number;
  onDone?: () => void;
};

export const SplashScreen = ({ hold = false, exitDelay = 650, onDone }: SplashProps) => {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (hold) return; // parent decides when it goes away
    // 1 full animation cycle (0.5s), a short hold, then fade out (0.3s)
    const t1 = setTimeout(() => setHidden(true), exitDelay);
    const t2 = setTimeout(() => {
      setRemoved(true);
      onDone?.();
    }, exitDelay + 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold]);

  if (removed) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity 0.3s ease",
      }}
    >
      <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>

        <div style={{
          position: "absolute",
          width: 44,
          height: 44,
          background: "#0099ff",
          zIndex: 1,
        }} />

        <div style={{
          position: "absolute",
          width: 44,
          height: 44,
          // In hold mode the cycle repeats. The four corner brackets are
          // symmetric, so a 90deg turn looks identical to 0deg and the loop is seamless.
          animation: hold
            ? "bracketCycle 0.5s ease-out infinite"
            : "bracketCycle 0.5s ease-out 1 forwards",
        }}>
          {[
            { top: -6, left: -6,   borderWidth: "2px 0 0 2px" },
            { top: -6, right: -6,  borderWidth: "2px 2px 0 0" },
            { bottom: -6, left: -6,  borderWidth: "0 0 2px 2px" },
            { bottom: -6, right: -6, borderWidth: "0 2px 2px 0" },
          ].map((s, i) => (
            <span key={i} style={{
              position: "absolute",
              width: 12,
              height: 12,
              borderStyle: "solid",
              borderColor: "#0099ff",
              ...s,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bracketCycle {
          0%   { transform: scale(1)   rotate(0deg);  }
          20%  { transform: scale(1.7) rotate(0deg);  }
          90%  { transform: scale(1)   rotate(90deg); }
          100% { transform: scale(1)   rotate(90deg); }
        }
      `}</style>
    </div>
  );
};

export const PageSkeleton = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#f0f2f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    }}
  >
    <div
      style={{
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: "#e2e5ea",
        animation: "skeletonPulse 1s ease-in-out infinite",
      }}
    />
    <style>{`
      @keyframes skeletonPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
  </div>
);
