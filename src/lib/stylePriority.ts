import { StyleScores } from "@/types";

// スタイル別ランキングで同スコア時に使うブランド優先度 (0-100)
export const STYLE_BRAND_PRIORITY: Record<keyof StyleScores, Record<string, number>> = {
  ground_tricks: {
    "SPREAD": 100, "RICE28": 96, "FNTC": 92, "011 Artistic": 89, "NOVEMBER": 86,
    "YONEX": 83, "ALLIAN": 80, "GRAY": 77, "WRX SB": 74, "CROOJA": 71,
    "MOSS": 68, "SCOOTER": 65, "FANATIC": 62, "DEATH LABEL": 59, "BC STREAM": 56,
    "CAPITA": 53, "BURTON": 50, "GNU": 47,
    "AMICSS": 55, "NUMBER": 52, "ZUMA": 50, "KM4K": 48, "DOUBLEDECK": 46,
    "CANARY CARTEL": 44, "MAKUW": 44, "NOAH SNOWBOARDING JAPAN": 42, "atirom-avs": 40,
  },
  park: {
    "BURTON": 100, "CAPITA": 96, "SALOMON": 90, "BATALEON": 86, "GNU": 82,
    "LIB TECH": 78, "ROME": 75, "NITRO": 72, "ALLIAN": 68, "YES.": 65,
    "NIDECKER": 62, "RIDE": 59, "DEATH LABEL": 56, "LOBSTER": 53, "K2": 50,
    "NOVEMBER": 47, "DINOSAURS WILL DIE": 44,
    "SESSIONS": 48, "SG SNOWBOARDS": 44, "WHITESPACE": 50, "ThirtyTwo": 52,
    "CARDIFF SNOWCRAFT": 42, "FORUM": 46, "SLASH": 44,
  },
  carving: {
    "OGASAKA": 100, "MOSS": 95, "FANATIC": 90, "NOVEMBER": 85, "GRAY": 82,
    "YONEX": 79, "WRX SB": 76, "BC STREAM": 73, "SALOMON": 70, "BURTON": 67,
    "RICE28": 64, "SCOOTER": 61, "HEAD": 58, "K2": 55, "KORUA": 52,
    "ROSSIGNOL": 49, "ELAN": 46, "ALLIAN": 43,
    "KESSLER": 88, "SECCA": 55, "WEST SNOWBOARD": 50, "EnGuard": 48, "TWELVE": 46,
    "WHITESPACE": 52, "atirom-avs": 44,
  },
  run_tricks: {
    "WRX SB": 100, "RICE28": 97, "SPREAD": 94, "FNTC": 91, "011 Artistic": 88,
    "FANATIC": 84, "CROOJA": 81, "SALOMON": 78, "BURTON": 75, "CAPITA": 72,
    "OGASAKA": 69, "GRAY": 66, "NOVEMBER": 64, "DEVGRU": 62, "HOLIDAY": 60,
    "BC STREAM": 58, "GNU": 55, "LIB TECH": 53, "YONEX": 50, "K2": 47,
    "AMICSS": 58, "NUMBER": 55, "ZUMA": 52, "KM4K": 50, "CANARY CARTEL": 48,
    "MAKUW": 46, "atirom-avs": 44,
  },
  powder: {
    "GENTEMSTICK": 100, "MOSS SNOWSTICK": 98, "JONES": 95, "KORUA": 92, "WESTON": 88,
    "ARBOR": 85, "NEVER SUMMER": 83, "BURTON": 80, "SALOMON": 78, "K2": 75,
    "UNITED SHAPES": 73, "SEASON": 70, "AMPLID": 68, "ENDEAVOR": 65, "SIGNAL": 62,
    "GNU": 60, "LIB TECH": 58, "NITRO": 55, "BATALEON": 52,
    "CARDIFF SNOWCRAFT": 60, "WHITESPACE": 58, "WEST SNOWBOARD": 50,
    "NOAH SNOWBOARDING JAPAN": 48, "EnGuard": 46, "TELOS": 48,
  },
};
