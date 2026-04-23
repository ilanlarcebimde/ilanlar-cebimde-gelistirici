import Image from "next/image";
import { useId } from "react";

/**
 * Hero-integrated global route art — static, no motion (aria-hidden).
 */

const HUBS = [
  { iso: "ca", xPct: 10.5, yPct: 26 },
  { iso: "us", xPct: 17.2, yPct: 35 },
  { iso: "gb", xPct: 38.5, yPct: 28.5 },
  { iso: "de", xPct: 44.2, yPct: 32 },
  { iso: "ae", xPct: 58.5, yPct: 47 },
  { iso: "au", xPct: 82, yPct: 68 },
] as const;

const ROUTE_SEGMENTS = [
  "M 105 161 C 128 178 145 198 172 217",
  "M 172 217 C 248 188 330 178 385 177",
  "M 385 177 C 412 182 432 192 442 198",
  "M 442 198 C 498 232 538 272 585 292",
  "M 585 292 C 668 338 748 388 820 422",
] as const;

function NetworkVisual({ idPrefix }: { idPrefix: string }) {
  const p = idPrefix;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full lg:scale-[1.06] lg:origin-[85%_45%]"
      viewBox="0 0 1000 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable={false}
    >
      <defs>
        <linearGradient id={`${p}-land`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(254, 252, 248, 0.09)" />
          <stop offset="100%" stopColor="rgba(201, 162, 39, 0.045)" />
        </linearGradient>
        <linearGradient id={`${p}-route`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="rgba(180, 150, 70, 0.03)" />
          <stop offset="50%" stopColor="rgba(253, 224, 138, 0.34)" />
          <stop offset="100%" stopColor="rgba(180, 150, 70, 0.03)" />
        </linearGradient>
        <linearGradient id={`${p}-route2`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,253,251,0.02)" />
          <stop offset="50%" stopColor="rgba(255,253,251,0.07)" />
          <stop offset="100%" stopColor="rgba(255,253,251,0.02)" />
        </linearGradient>
        <filter id={`${p}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity="0.9" className="max-md:opacity-75">
        <path
          fill={`url(#${p}-land)`}
          d="M 88 302 C 62 228 98 138 198 108 C 298 78 338 158 318 242 C 302 318 228 372 148 362 C 88 352 88 302 88 302 Z"
        />
        <path
          fill={`url(#${p}-land)`}
          opacity="0.68"
          d="M 328 158 C 428 118 528 152 558 242 C 578 318 518 392 428 402 C 348 408 308 338 318 258 C 322 218 328 158 328 158 Z"
        />
        <path
          fill={`url(#${p}-land)`}
          opacity="0.6"
          d="M 508 148 C 638 108 758 182 792 282 C 818 378 728 458 618 448 C 518 438 468 348 478 252 C 482 208 508 148 508 148 Z"
        />
        <path
          fill={`url(#${p}-land)`}
          opacity="0.52"
          d="M 668 378 C 758 348 848 392 868 468 C 882 532 818 588 728 582 C 648 578 602 512 618 442 C 628 408 668 378 668 378 Z"
        />
      </g>

      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx="500"
          cy="305"
          rx={210 + i * 52}
          ry={112 + i * 26}
          stroke="rgba(254,253,251,0.032)"
          strokeWidth="0.85"
          fill="none"
          strokeDasharray={i % 2 === 0 ? "3 16" : "2 12"}
          className="max-md:hidden"
        />
      ))}

      {ROUTE_SEGMENTS.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={`url(#${p}-route)`}
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 22"
          vectorEffect="non-scaling-stroke"
          opacity={0.88}
        />
      ))}

      <path
        d="M 120 328 Q 420 248 720 352"
        stroke={`url(#${p}-route2)`}
        strokeWidth="0.85"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="5 24"
        vectorEffect="non-scaling-stroke"
        className="max-md:opacity-0"
        opacity={0.55}
      />

      {HUBS.map((h) => {
        const cx = (h.xPct / 100) * 1000;
        const cy = (h.yPct / 100) * 620;
        return (
          <g key={h.iso} filter={`url(#${p}-glow)`}>
            <circle cx={cx} cy={cy} r="10" fill="rgba(251, 191, 36, 0.06)" />
            <circle cx={cx} cy={cy} r="3.8" fill="rgba(254, 243, 199, 0.9)" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="0.9" />
            <circle cx={cx} cy={cy} r="1.4" fill="#fffef8" />
          </g>
        );
      })}

      {/* Static jet mark — no motion */}
      <g transform="translate(468 238) rotate(14) scale(0.9)">
        <path
          d="M -5.5 0 L 4.5 -1 L 6.2 0 L 4.5 1 L -5.5 0 Z M -2.2 -2 L 0.4 0 L -2.2 2 Z"
          fill="rgba(253, 230, 138, 0.58)"
          stroke="rgba(255,253,248,0.12)"
          strokeWidth="0.22"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function FlagOrbit({ iso, xPct, yPct }: { iso: string; xPct: number; yPct: number }) {
  const src = `https://flagcdn.com/w80/${iso}.png`;
  return (
    <div
      className="absolute z-[1] -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      <div className="relative flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8 lg:h-9 lg:w-9">
        <span className="absolute inset-[-5px] rounded-full bg-amber-300/[0.05] blur-md" aria-hidden />
        <div className="relative h-full w-full overflow-hidden rounded-full border border-[#FEFDFB]/[0.14] bg-[#0f1a2c]/25 shadow-[0_3px_14px_rgba(0,0,0,0.22)] ring-1 ring-amber-200/15">
          <Image
            src={src}
            alt=""
            width={36}
            height={36}
            sizes="36px"
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

export function HeroWorldNetworkPanel() {
  const rawId = useId();
  const idPrefix = `hwg-${rawId.replace(/:/g, "")}`;

  return (
    <div
      className="pointer-events-none relative w-full min-h-[280px] sm:min-h-[360px] lg:min-h-[min(560px,calc(100vh-12rem))] lg:w-[min(132%,calc(100%+max(0px,(100vw-72rem)/2)+1.5rem)))] lg:max-w-[min(960px,95vw)] lg:self-stretch"
      aria-hidden
    >
      <div
        className="absolute inset-0 max-md:[mask-image:none] max-md:[-webkit-mask-image:none]"
        style={{
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 6%, rgba(0,0,0,0.55) 16%, #000 28%, #000 100%)",
          maskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 6%, rgba(0,0,0,0.55) 16%, #000 28%, #000 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_78%_38%,rgba(212,175,55,0.05),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[length:220%_100%] bg-[linear-gradient(105deg,transparent_0%,transparent_42%,rgba(255,252,245,0.04)_52%,transparent_62%,transparent_100%)] opacity-[0.22]"
          aria-hidden
        />

        <div className="relative h-full min-h-[inherit] w-full">
          <NetworkVisual idPrefix={idPrefix} />
          {HUBS.map((h) => (
            <FlagOrbit key={h.iso} iso={h.iso} xPct={h.xPct} yPct={h.yPct} />
          ))}
        </div>
      </div>
    </div>
  );
}
