import { HeroVideo } from "./HeroVideo";

/**
 * Full-bleed looping "packaging line" backdrop: film running over machine
 * rollers, the visual cue taken from the reference site's hero video.
 */
export function HeroScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="hero-scene" />

      {/* rollers + translucent film wrapping across them */}
      <div className="absolute inset-0 -skew-y-[5deg] scale-110">
        <div className="roller" style={{ top: "6%" }} />
        <div className="film" style={{ top: "9%", height: "32%", animationDuration: "13s" }} />
        <div className="roller" style={{ top: "36%", opacity: 0.7 }} />
        <div className="film" style={{ top: "38%", height: "38%", animationDuration: "9s", opacity: 0.8 }} />
        <div className="roller" style={{ top: "66%", opacity: 0.55 }} />
      </div>

      <div className="stripe-mark" />
      <HeroVideo />
      <div className="hero-vignette" />
      <div className="grain" />
    </div>
  );
}
