'use client';

import React from 'react';

export type ErrorCode = 404 | 500 | 501 | 403 | 503 | 419;

interface ErrorCharacterDisplayProps {
  code: ErrorCode;
  className?: string;
  onCharacterClick?: () => void;
}

export function ErrorCharacterDisplay({
  code,
  className = '',
  onCharacterClick,
}: ErrorCharacterDisplayProps) {
  return (
    <div
      onClick={onCharacterClick}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] ${className}`}
      title="Click to interact with character"
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className={`absolute -inset-6 rounded-full blur-2xl opacity-40 anim-pulse-glow pointer-events-none transition-colors duration-700 ${
          code === 404
            ? 'bg-rose-500/30'
            : code === 500
            ? 'bg-orange-500/35'
            : code === 501
            ? 'bg-amber-400/30'
            : code === 403
            ? 'bg-red-600/35'
            : code === 503
            ? 'bg-blue-500/30'
            : 'bg-purple-500/30'
        }`}
      />

      {code === 404 && <Character404Barnaby />}
      {code === 500 && <Character500Volt />}
      {code === 501 && <Character501Bruno />}
      {code === 403 && <Character403Reginald />}
      {code === 503 && <Character503Slumber />}
      {code === 419 && <Character419Chronos />}
    </div>
  );
}

// ============================================================================
// CHARACTER 404: Barnaby the Lost Space Explorer Cadet
// ============================================================================
function Character404Barnaby() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-xl anim-float"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Floating Space Island / Academic Pavers */}
      <ellipse cx="190" cy="305" rx="125" ry="18" fill="#18181B" opacity="0.12" />
      <g opacity="0.85">
        <path
          d="M70 240 L115 230 L135 255 L90 265 Z"
          fill="#E4E4E7"
          stroke="#A1A1AA"
          strokeWidth="2"
        />
        <path
          d="M260 250 L295 240 L315 260 L280 270 Z"
          fill="#E4E4E7"
          stroke="#A1A1AA"
          strokeWidth="2"
        />
        {/* Floating Question Marks in Orbit */}
        <text
          x="65"
          y="180"
          fill="#B81D22"
          fontSize="28"
          fontWeight="900"
          className="anim-float"
          style={{ animationDuration: '3.2s' }}
        >
          ?
        </text>
        <text
          x="305"
          y="150"
          fill="#B81D22"
          fontSize="24"
          fontWeight="900"
          className="anim-float"
          style={{ animationDuration: '4.8s' }}
        >
          ?
        </text>
      </g>

      {/* Backpack Jetpack with Lincoln Emblem */}
      <rect x="135" y="145" width="110" height="95" rx="20" fill="#27272A" />
      <rect x="145" y="155" width="90" height="40" rx="8" fill="#B81D22" />
      <circle cx="190" cy="175" r="8" fill="#FFFFFF" />
      {/* Thruster exhaust glow */}
      <ellipse cx="160" cy="245" rx="12" ry="6" fill="#F59E0B" opacity="0.7" />
      <ellipse cx="220" cy="245" rx="12" ry="6" fill="#F59E0B" opacity="0.7" />

      {/* Cadet Body Suit */}
      <rect x="150" y="160" width="80" height="90" rx="28" fill="#FAFAFA" stroke="#D4D4D8" strokeWidth="3" />
      <path d="M165 195 L215 195" stroke="#B81D22" strokeWidth="4" strokeLinecap="round" />
      <rect x="175" y="205" width="30" height="14" rx="4" fill="#18181B" />
      <text x="180" y="215" fill="#10B981" fontSize="8" fontFamily="monospace" fontWeight="bold">
        404-OK
      </text>

      {/* Legs & Cadet Boots */}
      <rect x="160" y="240" width="22" height="45" rx="10" fill="#E4E4E7" stroke="#D4D4D8" strokeWidth="2" />
      <rect x="198" y="240" width="22" height="45" rx="10" fill="#E4E4E7" stroke="#D4D4D8" strokeWidth="2" />
      <rect x="154" y="275" width="32" height="18" rx="8" fill="#B81D22" />
      <rect x="194" y="275" width="32" height="18" rx="8" fill="#B81D22" />

      {/* Big Explorer Helmet */}
      <circle cx="190" cy="115" r="62" fill="#FFFFFF" stroke="#E4E4E7" strokeWidth="4" />
      {/* Helmet Visor */}
      <ellipse cx="190" cy="115" rx="48" ry="40" fill="#18181B" />
      {/* Visor Glare / Reflection */}
      <path
        d="M160 90 Q190 85 215 95 Q180 100 155 115 Z"
        fill="#38BDF8"
        opacity="0.6"
      />
      {/* Cute Cadet Eyes looking puzzled inside visor */}
      <g className="anim-blink">
        <circle cx="178" cy="115" r="7" fill="#60A5FA" />
        <circle cx="180" cy="113" r="2.5" fill="#FFFFFF" />
        <circle cx="202" cy="115" r="7" fill="#60A5FA" />
        <circle cx="204" cy="113" r="2.5" fill="#FFFFFF" />
        {/* Puzzled wavy mouth line inside */}
        <path d="M185 130 Q190 126 195 130" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Helmet Antenna with blinking signal */}
      <line x1="190" y1="53" x2="190" y2="28" stroke="#B81D22" strokeWidth="4" strokeLinecap="round" />
      <circle cx="190" cy="24" r="7" fill="#EF4444" className="anim-spark" />

      {/* Left Hand: Holding Upside-Down Campus Map */}
      <g transform="rotate(-15 125 190)">
        <rect x="100" y="165" width="45" height="60" rx="4" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
        <path d="M106 175 L138 175 M106 185 L138 185 M106 195 L125 195" stroke="#A16207" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
        <text x="110" y="213" fill="#B81D22" fontSize="9" fontWeight="bold" transform="rotate(180 122 210)">
          MAP
        </text>
        <circle cx="140" cy="195" r="10" fill="#E4E4E7" stroke="#D4D4D8" strokeWidth="2" />
      </g>

      {/* Right Hand: Holographic Radar / Spinning Compass */}
      <g transform="translate(235, 175)">
        <circle cx="20" cy="20" r="11" fill="#E4E4E7" stroke="#D4D4D8" strokeWidth="2" />
        {/* Hologram Rings */}
        <circle cx="20" cy="20" r="32" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" className="anim-spin-slow" />
        <circle cx="20" cy="20" r="22" stroke="#60A5FA" strokeWidth="2" opacity="0.8" />
        {/* Compass Needle */}
        <path d="M20 6 L25 20 L20 17 L15 20 Z" fill="#EF4444" />
        <path d="M20 34 L25 20 L20 23 L15 20 Z" fill="#94A3B8" />
      </g>
    </svg>
  );
}

// ============================================================================
// CHARACTER 500: Volt the Overclocked Gearbot
// ============================================================================
function Character500Volt() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-xl anim-float"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground Shadow */}
      <ellipse cx="190" cy="305" rx="115" ry="16" fill="#18181B" opacity="0.12" />

      {/* Steam Puffs rising from head vents */}
      <g>
        <circle cx="145" cy="55" r="10" fill="#A1A1AA" className="anim-steam-1" />
        <circle cx="140" cy="40" r="14" fill="#D4D4D8" className="anim-steam-2" />
        <circle cx="235" cy="55" r="10" fill="#A1A1AA" className="anim-steam-2" />
        <circle cx="240" cy="38" r="15" fill="#D4D4D8" className="anim-steam-3" />
      </g>

      {/* Exhaust Pipes on Shoulders */}
      <rect x="135" y="70" width="22" height="25" rx="4" fill="#52525B" />
      <rect x="223" y="70" width="22" height="25" rx="4" fill="#52525B" />

      {/* Robot Head: Vintage CRT Monitor */}
      <rect x="125" y="80" width="130" height="95" rx="20" fill="#27272A" stroke="#3F3F46" strokeWidth="4" />
      {/* Monitor Screen Frame */}
      <rect x="138" y="92" width="104" height="72" rx="12" fill="#09090B" />

      {/* Dizzy X_X / Spiral Eyes inside CRT */}
      <g>
        {/* Left Dizzy Eye */}
        <path d="M155 116 L175 136 M175 116 L155 136" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
        {/* Right Dizzy Eye */}
        <path d="M205 116 L225 136 M225 116 L205 136" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
        {/* Wobbly Glitchy Mouth */}
        <path d="M172 148 L180 144 L190 150 L200 144 L208 148" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Flashing Warning Beacon on Top of CRT */}
      <rect x="180" y="65" width="20" height="15" fill="#52525B" />
      <path d="M182 65 Q190 50 198 65 Z" fill="#EF4444" className="anim-spark" />

      {/* Robot Torso / Chassis */}
      <rect x="135" y="180" width="110" height="90" rx="18" fill="#3F3F46" stroke="#27272A" strokeWidth="3" />
      {/* Yellow/Black Hazard Stripes on Chest */}
      <g clipPath="url(#hazard-clip)">
        <rect x="145" y="190" width="90" height="22" rx="4" fill="#FACC15" />
        <line x1="140" y1="190" x2="160" y2="212" stroke="#18181B" strokeWidth="8" />
        <line x1="165" y1="190" x2="185" y2="212" stroke="#18181B" strokeWidth="8" />
        <line x1="190" y1="190" x2="210" y2="212" stroke="#18181B" strokeWidth="8" />
        <line x1="215" y1="190" x2="235" y2="212" stroke="#18181B" strokeWidth="8" />
      </g>
      <clipPath id="hazard-clip">
        <rect x="145" y="190" width="90" height="22" rx="4" />
      </clipPath>

      {/* Open Maintenance Hatch with Spinning Gear */}
      <rect x="148" y="218" width="84" height="42" rx="6" fill="#18181B" />
      <circle cx="175" cy="239" r="14" fill="#F59E0B" className="anim-spin-slow" stroke="#D97706" strokeWidth="2" strokeDasharray="6 3" />
      <circle cx="175" cy="239" r="6" fill="#18181B" />
      <circle cx="205" cy="242" r="10" fill="#EF4444" opacity="0.8" />
      <circle cx="205" cy="242" r="4" fill="#FCA5A5" />

      {/* Stumpy Tread Feet */}
      <rect x="145" y="270" width="35" height="25" rx="8" fill="#18181B" />
      <rect x="200" y="270" width="35" height="25" rx="8" fill="#18181B" />
      <line x1="150" y1="285" x2="175" y2="285" stroke="#71717A" strokeWidth="3" strokeDasharray="4 4" />
      <line x1="205" y1="285" x2="230" y2="285" stroke="#71717A" strokeWidth="3" strokeDasharray="4 4" />

      {/* Arms Holding Severed High-Voltage Cables */}
      {/* Left Arm & Cable */}
      <path d="M135 195 Q95 210 110 245" stroke="#52525B" strokeWidth="12" strokeLinecap="round" />
      <rect x="102" y="235" width="16" height="24" rx="6" fill="#DC2626" />
      {/* Copper strands */}
      <path d="M110 259 Q120 270 140 268" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

      {/* Right Arm & Cable */}
      <path d="M245 195 Q285 210 270 245" stroke="#52525B" strokeWidth="12" strokeLinecap="round" />
      <rect x="262" y="235" width="16" height="24" rx="6" fill="#2563EB" />
      {/* Copper strands */}
      <path d="M270 259 Q260 270 240 268" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

      {/* Electric Sparks jumping across the severed gap! */}
      <g className="anim-spark" transform="translate(180, 260)">
        <polygon points="10,0 14,8 24,9 16,16 19,25 10,19 2,24 5,15 -3,8 7,7" fill="#38BDF8" />
        <polygon points="10,4 12,9 18,10 13,14 15,20 10,16 5,19 7,13 2,9 8,8" fill="#FEF08A" />
      </g>
    </svg>
  );
}

// ============================================================================
// CHARACTER 501: Bruno the Digital Architect Beaver / Cyber Builder
// ============================================================================
function Character501Bruno() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-xl anim-float"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="190" cy="305" rx="120" ry="16" fill="#18181B" opacity="0.12" />

      {/* Beaver Tail */}
      <ellipse cx="120" cy="275" rx="36" ry="16" fill="#78350F" stroke="#451A03" strokeWidth="3" transform="rotate(-20 120 275)" />
      {/* Waffle tail texture */}
      <path d="M100 270 L140 280 M105 280 L135 268 M115 265 L125 285" stroke="#451A03" strokeWidth="2" />

      {/* Body in High-Vis Safety Vest */}
      <ellipse cx="190" cy="225" rx="55" ry="60" fill="#92400E" />
      {/* Bright Orange/Yellow High-Vis Vest */}
      <path
        d="M148 185 C148 185 165 260 190 260 C215 260 232 185 232 185 L215 180 L190 210 L165 180 Z"
        fill="#F59E0B"
      />
      {/* Reflective Silver Stripes */}
      <path d="M158 220 L222 220" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <path d="M165 240 L215 240" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />

      {/* Cute Beaver Head */}
      <circle cx="190" cy="135" r="48" fill="#92400E" />
      {/* Snout */}
      <ellipse cx="190" cy="148" rx="26" ry="18" fill="#FDE68A" />
      {/* Dark Nose */}
      <ellipse cx="190" cy="140" rx="9" ry="6" fill="#18181B" />
      {/* Signature Beaver White Front Teeth */}
      <rect x="184" y="153" width="6" height="10" rx="2" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1" />
      <rect x="190" y="153" width="6" height="10" rx="2" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1" />

      {/* Round Cheerful Eyes */}
      <g className="anim-blink">
        <circle cx="172" cy="128" r="6" fill="#18181B" />
        <circle cx="174" cy="126" r="2" fill="#FFFFFF" />
        <circle cx="208" cy="128" r="6" fill="#18181B" />
        <circle cx="210" cy="126" r="2" fill="#FFFFFF" />
      </g>

      {/* Ears */}
      <circle cx="148" cy="100" r="14" fill="#78350F" />
      <circle cx="148" cy="100" r="8" fill="#FDE68A" />
      <circle cx="232" cy="100" r="14" fill="#78350F" />
      <circle cx="232" cy="100" r="8" fill="#FDE68A" />

      {/* Yellow Construction Hard Hat with Lincoln Crest */}
      <path d="M135 105 Q190 70 245 105 L252 112 Q190 98 128 112 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="3" />
      <rect x="142" y="105" width="96" height="6" rx="3" fill="#CA8A04" />
      <circle cx="190" cy="94" r="8" fill="#B81D22" />
      <text x="187" y="97" fill="#FFFFFF" fontSize="7" fontWeight="bold">L</text>

      {/* Safety Goggles on Hardhat */}
      <rect x="160" y="80" width="26" height="16" rx="6" fill="#0284C7" stroke="#18181B" strokeWidth="2" opacity="0.8" />
      <rect x="194" y="80" width="26" height="16" rx="6" fill="#0284C7" stroke="#18181B" strokeWidth="2" opacity="0.8" />
      <line x1="186" y1="88" x2="194" y2="88" stroke="#18181B" strokeWidth="2" />

      {/* Left Hand: Holding Glowing Hologram Blueprint */}
      <g transform="translate(85, 175)">
        {/* Holographic Glowing Grid Blueprint */}
        <rect x="0" y="0" width="65" height="50" rx="4" fill="#082F49" stroke="#0284C7" strokeWidth="2" />
        {/* Wireframe grids */}
        <line x1="10" y1="12" x2="55" y2="12" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="10" y1="24" x2="40" y2="24" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="10" y1="36" x2="50" y2="36" stroke="#38BDF8" strokeWidth="1.5" />
        <rect x="42" y="20" width="16" height="22" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 2" />
        <text x="8" y="8" fill="#38BDF8" fontSize="6" fontWeight="bold">SMTS_v2.0_DRAFT</text>
        {/* Hand Paw */}
        <circle cx="60" cy="40" r="10" fill="#92400E" />
      </g>

      {/* Right Hand: Waving High-Tech Laser Wrench */}
      <g transform="translate(245, 170) rotate(-20)">
        <rect x="0" y="15" width="12" height="45" rx="4" fill="#71717A" stroke="#3F3F46" strokeWidth="2" />
        <path d="M-4 15 C-4 0 16 0 16 15 L12 18 C10 8 2 8 0 18 Z" fill="#D4D4D8" stroke="#71717A" strokeWidth="2" />
        {/* Paw */}
        <circle cx="6" cy="35" r="10" fill="#92400E" />
        {/* Laser sparkles */}
        <circle cx="6" cy="2" r="3" fill="#06B6D4" className="anim-spark" />
      </g>

      {/* Safety Traffic Cone on the side */}
      <g transform="translate(275, 240)">
        <polygon points="20,0 8,50 32,50" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
        <polygon points="17,14 13,30 27,30 23,14" fill="#FFFFFF" />
        <rect x="0" y="48" width="40" height="8" rx="2" fill="#18181B" />
      </g>
    </svg>
  );
}

// ============================================================================
// CHARACTER 403: Sir Reginald the Cyber Sentry
// ============================================================================
function Character403Reginald() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-xl anim-float"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="190" cy="305" rx="120" ry="16" fill="#18181B" opacity="0.15" />

      {/* Closed Heavy Security Gate / Laser Barrier in Background */}
      <g opacity="0.4">
        <line x1="80" y1="210" x2="300" y2="210" stroke="#EF4444" strokeWidth="3" strokeDasharray="8 4" className="anim-spark" />
        <line x1="80" y1="230" x2="300" y2="230" stroke="#EF4444" strokeWidth="3" strokeDasharray="8 4" className="anim-spark" />
        <line x1="80" y1="250" x2="300" y2="250" stroke="#EF4444" strokeWidth="3" strokeDasharray="8 4" className="anim-spark" />
      </g>

      {/* Sentry Body: Titanium Cyber Plate Armor */}
      <path d="M145 155 Q190 145 235 155 L225 260 L155 260 Z" fill="#27272A" stroke="#3F3F46" strokeWidth="3" />
      {/* Chestplate Armor Segment */}
      <path d="M158 175 L222 175 L215 225 L165 225 Z" fill="#3F3F46" />
      {/* Core Security Light */}
      <circle cx="190" cy="200" r="10" fill="#B81D22" className="anim-spark" />
      <circle cx="190" cy="200" r="4" fill="#FFFFFF" />

      {/* Armored Shoulders */}
      <ellipse cx="135" cy="165" rx="20" ry="14" fill="#52525B" stroke="#27272A" strokeWidth="2" />
      <ellipse cx="245" cy="165" rx="20" ry="14" fill="#52525B" stroke="#27272A" strokeWidth="2" />

      {/* Sentry Helmet with Knight Crest */}
      <path d="M150 95 Q190 70 230 95 L225 150 Q190 160 155 150 Z" fill="#18181B" stroke="#3F3F46" strokeWidth="3" />
      {/* Knight Plume */}
      <path d="M185 75 Q190 40 215 45 Q195 65 195 75 Z" fill="#B81D22" />

      {/* Optical Laser Visor (Sweeping Red Eye) */}
      <rect x="160" y="112" width="60" height="12" rx="4" fill="#09090B" />
      <ellipse cx="190" cy="118" rx="14" ry="4" fill="#EF4444" className="anim-spark" />
      <circle cx="190" cy="118" r="2" fill="#FFFFFF" />

      {/* Giant Armored Security Shield with Lincoln Emblem */}
      <g transform="translate(75, 160)">
        <path
          d="M15 10 Q45 0 75 10 L70 85 Q45 115 15 95 Z"
          fill="#B81D22"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        {/* Inner Shield Layer */}
        <path
          d="M23 18 Q45 10 67 18 L63 78 Q45 102 23 86 Z"
          fill="#9E1519"
        />
        {/* Padlock Icon on Shield */}
        <rect x="36" y="45" width="18" height="16" rx="4" fill="#FACC15" />
        <path d="M40 45 V37 C40 32 50 32 50 37 V45" stroke="#FACC15" strokeWidth="3" fill="none" />
        <circle cx="45" cy="53" r="2.5" fill="#18181B" />
      </g>

      {/* Floating Holographic "ACCESS DENIED" Key */}
      <g transform="translate(245, 175)">
        <circle cx="20" cy="20" r="14" fill="#18181B" stroke="#EF4444" strokeWidth="2" />
        <path d="M20 12 L20 28 M12 20 L28 20" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        <rect x="18" y="28" width="5" height="30" fill="#EF4444" rx="2" />
        <rect x="23" y="44" width="8" height="4" fill="#EF4444" rx="1" />
        <rect x="23" y="52" width="6" height="4" fill="#EF4444" rx="1" />
      </g>
    </svg>
  );
}

// ============================================================================
// CHARACTER 503: Slumber the Maintenance Server Sloth
// ============================================================================
function Character503Slumber() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-xl anim-float"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground Shadow */}
      <ellipse cx="190" cy="305" rx="120" ry="16" fill="#18181B" opacity="0.12" />

      {/* Server Rack Left */}
      <rect x="65" y="80" width="55" height="210" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="3" />
      <rect x="73" y="95" width="39" height="18" rx="3" fill="#27272A" />
      <circle cx="80" cy="104" r="3" fill="#10B981" />
      <circle cx="89" cy="104" r="3" fill="#10B981" />
      <circle cx="98" cy="104" r="3" fill="#EF4444" className="anim-spark" />

      <rect x="73" y="125" width="39" height="18" rx="3" fill="#27272A" />
      <circle cx="80" cy="134" r="3" fill="#10B981" />
      <circle cx="89" cy="134" r="3" fill="#3B82F6" />

      <rect x="73" y="155" width="39" height="18" rx="3" fill="#27272A" />
      <circle cx="80" cy="164" r="3" fill="#10B981" />

      {/* Server Rack Right */}
      <rect x="260" y="80" width="55" height="210" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="3" />
      <rect x="268" y="95" width="39" height="18" rx="3" fill="#27272A" />
      <circle cx="275" cy="104" r="3" fill="#10B981" />
      <circle cx="284" cy="104" r="3" fill="#F59E0B" />

      <rect x="268" y="125" width="39" height="18" rx="3" fill="#27272A" />
      <circle cx="275" cy="134" r="3" fill="#10B981" />

      <rect x="268" y="155" width="39" height="18" rx="3" fill="#27272A" />
      <circle cx="275" cy="164" r="3" fill="#10B981" />
      <circle cx="284" cy="164" r="3" fill="#10B981" />

      {/* Sloth Hammock strung between the server racks */}
      <path
        d="M100 130 Q190 230 280 130"
        stroke="#E4E4E7"
        strokeWidth="6"
        fill="#F4F4F5"
        strokeLinecap="round"
      />
      <path
        d="M105 138 Q190 235 275 138"
        stroke="#B81D22"
        strokeWidth="2"
        strokeDasharray="4 4"
        fill="none"
      />

      {/* Hanging Maintenance Sign */}
      <g transform="translate(145, 235)">
        <rect x="0" y="0" width="90" height="30" rx="4" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
        <line x1="15" y1="0" x2="15" y2="-12" stroke="#71717A" strokeWidth="1.5" />
        <line x1="75" y1="0" x2="75" y2="-12" stroke="#71717A" strokeWidth="1.5" />
        <text x="12" y="18" fill="#854D0E" fontSize="9" fontWeight="bold">
          MAINTENANCE
        </text>
      </g>

      {/* Sleeping Sloth curled up in Hammock */}
      <ellipse cx="190" cy="175" rx="45" ry="32" fill="#78716C" />
      {/* Blue technician overalls */}
      <path d="M165 170 Q190 205 215 170 Z" fill="#2563EB" />

      {/* Sloth Head with sleep mask / closed peaceful eyes */}
      <circle cx="160" cy="155" r="24" fill="#A8A29E" />
      {/* Eye patches */}
      <ellipse cx="152" cy="154" rx="8" ry="6" fill="#57534E" transform="rotate(-15 152 154)" />
      <ellipse cx="168" cy="154" rx="8" ry="6" fill="#57534E" transform="rotate(15 168 154)" />
      {/* Sleeping happy closed curved eyes */}
      <path d="M148 155 Q152 160 156 155" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M164 155 Q168 160 172 155" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="160" cy="162" rx="4" ry="3" fill="#1C1917" />

      {/* Sleeping Nightcap */}
      <path d="M150 135 Q135 110 115 125 Q130 145 170 138 Z" fill="#B81D22" />
      <circle cx="115" cy="125" r="7" fill="#FFFFFF" />

      {/* Floating Animated 'Z z z' */}
      <text x="135" y="115" fill="#3B82F6" fontSize="18" fontWeight="bold" className="anim-float" style={{ animationDuration: '3s' }}>
        Z
      </text>
      <text x="125" y="95" fill="#60A5FA" fontSize="24" fontWeight="bold" className="anim-float" style={{ animationDuration: '4s' }}>
        z
      </text>
      <text x="110" y="70" fill="#93C5FD" fontSize="30" fontWeight="bold" className="anim-float" style={{ animationDuration: '5s' }}>
        z
      </text>
    </svg>
  );
}

// ============================================================================
// CHARACTER 419: Chronos the Clockwork Rabbit (Session / CSRF Expired)
// ============================================================================
function Character419Chronos() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-xl anim-float"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="190" cy="305" rx="120" ry="16" fill="#18181B" opacity="0.12" />

      {/* Floating scattered papers / session tickets caught in temporal gust */}
      <g opacity="0.8">
        <rect x="70" y="170" width="30" height="38" rx="2" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1.5" transform="rotate(-25 70 170)" />
        <line x1="75" y1="180" x2="95" y2="175" stroke="#A1A1AA" strokeWidth="2" />
        <line x1="78" y1="190" x2="92" y2="186" stroke="#A1A1AA" strokeWidth="2" />

        <rect x="285" y="130" width="32" height="42" rx="2" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1.5" transform="rotate(30 285 130)" />
        <text x="290" y="155" fill="#EF4444" fontSize="7" fontWeight="bold" transform="rotate(30 285 130)">
          EXPIRED
        </text>
      </g>

      {/* Giant Glowing Hourglass in Background */}
      <g transform="translate(130, 80)">
        {/* Top & Bottom wooden caps */}
        <rect x="15" y="0" width="90" height="12" rx="4" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        <rect x="15" y="150" width="90" height="12" rx="4" fill="#78350F" stroke="#451A03" strokeWidth="2" />
        {/* Side Brass Pillars */}
        <line x1="22" y1="12" x2="22" y2="150" stroke="#D97706" strokeWidth="4" />
        <line x1="98" y1="12" x2="98" y2="150" stroke="#D97706" strokeWidth="4" />
        {/* Glass Bulbs */}
        <path
          d="M25 15 C25 60 52 81 52 81 C52 81 25 102 25 147 L95 147 C95 102 68 81 68 81 C68 81 95 60 95 15 Z"
          fill="#EEF2FF"
          stroke="#C7D2FE"
          strokeWidth="3"
          opacity="0.8"
        />
        {/* Golden Falling Sand */}
        {/* Bottom Bulb Sand Mound */}
        <path d="M35 145 C45 125 75 125 85 145 Z" fill="#F59E0B" />
        {/* Trickling stream */}
        <line x1="60" y1="80" x2="60" y2="135" stroke="#F59E0B" strokeWidth="3" strokeDasharray="4 2" />
        {/* Top Bulb emptying sand */}
        <path d="M42 50 C50 65 70 65 78 50 Z" fill="#F59E0B" />
      </g>

      {/* Clockwork Rabbit Hero in front */}
      {/* Long Rabbit Ears */}
      <ellipse cx="170" cy="115" rx="10" ry="42" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="2" transform="rotate(-15 170 115)" />
      <ellipse cx="170" cy="115" rx="5" ry="32" fill="#F472B6" opacity="0.6" transform="rotate(-15 170 115)" />

      <ellipse cx="210" cy="115" rx="10" ry="42" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="2" transform="rotate(15 210 115)" />
      <ellipse cx="210" cy="115" rx="5" ry="32" fill="#F472B6" opacity="0.6" transform="rotate(15 210 115)" />

      {/* Rabbit Head */}
      <ellipse cx="190" cy="175" rx="34" ry="30" fill="#FAFAFA" stroke="#D4D4D8" strokeWidth="3" />
      {/* Clockwork Goggles on Snout */}
      <circle cx="178" cy="170" r="12" fill="#FEF08A" stroke="#B45309" strokeWidth="3" />
      <circle cx="178" cy="170" r="4" fill="#B45309" />
      <circle cx="202" cy="170" r="12" fill="#FEF08A" stroke="#B45309" strokeWidth="3" />
      <circle cx="202" cy="170" r="4" fill="#B45309" />
      <line x1="190" y1="170" x2="190" y2="170" stroke="#B45309" strokeWidth="3" />

      {/* Cute Pink Rabbit Snout */}
      <polygon points="190,183 186,178 194,178" fill="#F472B6" />
      <path d="M186 186 Q190 190 194 186" stroke="#71717A" strokeWidth="1.5" fill="none" />

      {/* Red Velvet Vest & Golden Pocket Watch Chain */}
      <path d="M168 200 C168 200 178 245 190 245 C202 245 212 200 212 200 Z" fill="#B81D22" />
      <path d="M178 215 Q190 225 202 218" stroke="#FBBF24" strokeWidth="3" fill="none" />

      {/* Running Paws with Oversized Pocket Watch */}
      <g transform="translate(195, 215)">
        <circle cx="25" cy="25" r="22" fill="#FEF08A" stroke="#B45309" strokeWidth="3" />
        <circle cx="25" cy="25" r="18" fill="#FFFFFF" />
        {/* Watch Hands */}
        <line x1="25" y1="25" x2="25" y2="12" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="25" x2="35" y2="25" stroke="#B81D22" strokeWidth="2" strokeLinecap="round" />
        {/* Winder */}
        <rect x="23" y="0" width="4" height="4" fill="#B45309" />
      </g>
    </svg>
  );
}
