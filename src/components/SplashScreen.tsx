import { useEffect, useState } from “react”;

/**

- One-time opening splash:
- - White background
- - Solid blue square + 4 corner brackets that expand then rotate+shrink
- - Fades out after 1.5s
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
position: “fixed”,
inset: 0,
background: “#ffffff”,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
zIndex: 9999,
opacity: hidden ? 0 : 1,
pointerEvents: hidden ? “none” : “auto”,
transition: “opacity 0.4s ease”,
}}
>
{/* Preloader */}
<div style={{ position: “relative”, width: 80, height: 80, display: “flex”, alignItems: “center”, justifyContent: “center” }}>

```
    {/* Static blue square */}
    <div style={{
      position: "absolute",
      width: 44,
      height: 44,
      background: "#0099ff",
      zIndex: 1,
    }} />

    {/* Bracket wrapper — same size as square, brackets stick out from edges */}
    <div style={{
      position: "absolute",
      width: 44,
      height: 44,
      animation: "bracketCycle 0.9s ease-in-out infinite",
    }}>
      {[
        { top: -6, left: -6,  borderWidth: "2px 0 0 2px" },
        { top: -6, right: -6, borderWidth: "2px 2px 0 0" },
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
      30%  { transform: scale(1.7) rotate(0deg);  }
      95%  { transform: scale(1)   rotate(90deg); }
      100% { transform: scale(1)   rotate(90deg); }
    }
  `}</style>
</div>
```

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
