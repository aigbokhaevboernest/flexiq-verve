import { useEffect, useState } from "react";

/**
 * One-time opening splash:
 *  - White background
 *  - Solid blue square + 4 rotating bracket marks
 *  - Fades out after 1.5s
 */
export const SplashScreen = () => {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHidden(true), 1500);
    const t2 = setTimeout(() => setRemoved(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
        transition: "opacity 0.4s ease",
      }}
    >
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <div
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: 60, height: 60, background: "#4A90D9",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            animation: "splashRotate 1.5s linear infinite",
          }}
        >
          {[
            { top: 0, left: 0, borderTop: "3px solid #4A90D9", borderLeft: "3px solid #4A90D9" },
            { top: 0, right: 0, borderTop: "3px solid #4A90D9", borderRight: "3px solid #4A90D9" },
            { bottom: 0, left: 0, borderBottom: "3px solid #4A90D9", borderLeft: "3px solid #4A90D9" },
            { bottom: 0, right: 0, borderBottom: "3px solid #4A90D9", borderRight: "3px solid #4A90D9" },
          ].map((s, i) => (
            <span key={i} style={{ position: "absolute", width: 18, height: 18, ...s }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes splashRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/** Page-level skeleton: pulsing centered circle on off-white. */
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
        animation: "skeletonPulse 1.5s ease-in-out infinite",
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
