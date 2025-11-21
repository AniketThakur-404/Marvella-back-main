import { useRef, useState, useEffect } from "react";

/* =============================== SHADES ================================== */
const LIPSTICK_SHADES = [
  { id: 0, code: null, name: "NA", color: "transparent" },
  { id: 1, code: "601", name: "Scarlet Siren", color: "#B82229" },
  { id: 2, code: "602", name: "Rouge Eternelle", color: "#8D1D27" },
  { id: 3, code: "603", name: "Power Play", color: "#631820" },
  { id: 4, code: "604", name: "Spiced Silk", color: "#A64D3E" },
  { id: 5, code: "605", name: "Bare Bloom", color: "#D18A68" },
  { id: 6, code: "606", name: "Peach Tantra", color: "#F2A36E" },
  { id: 7, code: "607", name: "Rose Flame", color: "#C95A6C" },
  { id: 8, code: "608", name: "Whisper Nude", color: "#C79082" },
  { id: 9, code: "609", name: "Bloom Creme", color: "#D24E71" },
  { id: 10, code: "610", name: "Berry Amour", color: "#8A3832" },
  { id: 11, code: "611", name: "Cinnamon Saffron", color: "#B64A29" },
  { id: 12, code: "612", name: "Oud Royale", color: "#431621" },
  { id: 13, code: "613", name: "Velvet Crush", color: "#C22A2D" },
  { id: 14, code: "614", name: "Spiced Ember", color: "#A03529" },
  { id: 15, code: "615", name: "Creme Blush", color: "#CF5F4C" },
  { id: 16, code: "616", name: "Caramel Eclair", color: "#C77444" },
  { id: 17, code: "617", name: "Rose Fantasy", color: "#C25D6A" },
  { id: 18, code: "618", name: "Mauve Memoir", color: "#A86267" },
  { id: 19, code: "619", name: "Rouge Mistral", color: "#94373F" },
  { id: 20, code: "620", name: "Flushed Fig", color: "#9A4140" },
  { id: 21, code: "621", name: "Terracotta Dream", color: "#C5552F" },
  { id: 22, code: "622", name: "Nude Myth", color: "#AF705A" },
  { id: 23, code: "623", name: "Runway Rani", color: "#D13864" },
];

const PRODUCT_LINE_LABEL = "Marvella Luxe - Satin Lipstick";
const SHADE_SCROLL_FRACTION = 0.55;

/* ============================== LANDMARKS ================================= */
const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP_OUTER = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LOWER_LIP_INNER = [95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

const LIP_LANDMARK_INDICES = new Set([
  ...UPPER_LIP_OUTER,
  ...LOWER_LIP_OUTER,
  ...UPPER_LIP_INNER,
  ...LOWER_LIP_INNER,
]);

/* ============================ TUNABLE PARAMS ============================== */
const BASE_SMOOTHING = 0.85;
const MIN_LIP_SMOOTHING = 0.72;
const MAX_LIP_SMOOTHING = 0.992;
const POSITION_SNAP_THRESHOLD = 0.0025;

const BASE_OPACITY = 0.84;
const SHADOW_BOOST = 0.2;

const DPR_DESKTOP = 2;
const DPR_MOBILE = 1.5;
const MAX_BBOX_PAD = 12;

const LIP_ON_FRAMES = 2;
const LIP_OFF_FRAMES = 2;
const MIN_LIP_AREA_PCT = 0.00012;
const MAX_LIP_AREA_PCT = 0.12;
const MAX_LIP_ASPECT = 28;
const STICKY_HOLD_FRAMES = 16;

const AREA_EMA_ALPHA = 0.18;
const OCCL_AREA_DROP = 0.55;
const OCCL_JITTER_THRESH = 0.05;
const OCCL_Z_STD_THRESH = 0.02;
const OCCL_MIN_FRAMES = 3;
const HEAD_VEL_THRESH = 0.03;
const HAND_OVERLAP_RATIO = 0.035;
const HAND_BBOX_PAD_PX = 36;
const ONLY_HIDE_ON_HAND = true;

// NEW: limit how far lips are allowed to “jump” between frames
// (fraction of frame diagonal). If exceeded, we keep previous lips.
const MAX_LIP_JUMP_NORM = 0.12;

const MASK_EASE_ALPHA = 0.86;
const FEATHER_EMA_ALPHA = 0.25;
const FADE_IN_MS = 90;
const FADE_OUT_MS = 80;

const LIP_AREA_ON_MULT = 1.05;
const LIP_AREA_OFF_MULT = 0.9;
const HAND_OCCL_ON_FRAMES = 2;

const OUTER_SCALE = 1.025;
const INNER_SCALE = 0.985;
const UPPER_Y_BIAS_MAX = 2.0;
const SOFT_EDGE_BOOST = 0.4;

/* ========================== ROBUST MODEL LOADER =========================== */
const FACE_MESH_URLS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js",
  "https://unpkg.com/@mediapipe/face_mesh@0.4/face_mesh.js",
];
const HANDS_URLS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js",
  "https://unpkg.com/@mediapipe/hands@0.4/hands.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

async function ensureOne(className, urls) {
  if (window[className]) return true;
  for (const url of urls) {
    try {
      await loadScript(url);
      if (window[className]) return true;
    } catch (_) {}
  }
  return !!window[className];
}

async function ensureModels() {
  const okFace = await ensureOne("FaceMesh", FACE_MESH_URLS);
  const okHands = await ensureOne("Hands", HANDS_URLS);
  return okFace && okHands;
}

/* =============================== UTIL: COLOR ============================== */
function hexToRgb(hex) {
  if (hex === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r: isNaN(r) ? 200 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b, a: 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  let l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/* ============================== GEOMETRY ================================== */
function smoothPolyline(points, iterations = 1) {
  let pts = points.slice();
  for (let k = 0; k < iterations; k++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      const Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
      const R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
      out.push(Q, R);
    }
    pts = out;
  }
  return pts;
}

function makePathFromRings(outerPts, innerPts) {
  const path = new Path2D();
  path.moveTo(outerPts[0].x, outerPts[0].y);
  for (let i = 1; i < outerPts.length; i++) path.lineTo(outerPts[i].x, outerPts[i].y);
  path.closePath();
  if (innerPts && innerPts.length) {
    path.moveTo(innerPts[0].x, innerPts[0].y);
    for (let i = 1; i < innerPts.length; i++) path.lineTo(innerPts[i].x, innerPts[i].y);
    path.closePath();
  }
  return path;
}

function computeBBox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

function rectFromPoints(points) {
  const b = computeBBox(points);
  return { x: b.x, y: b.y, w: b.w, h: b.h };
}

function rectPad(r, pad) {
  return { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
}

function rectArea(r) {
  return Math.max(0, r.w) * Math.max(0, r.h);
}

function rectIntersectArea(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  return w * h;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  return Math.abs(area) * 0.5;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function computeCentroid(points) {
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

function stddev(arr) {
  if (!arr.length) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

function lipsArePresent(outer_px, frameW, frameH) {
  if (!outer_px || outer_px.length < 8) return false;
  const bbox = computeBBox(outer_px);
  if (bbox.w < 4 || bbox.h < 4) return false;
  const bleed = 2;
  const inFrame =
    bbox.x >= -bleed &&
    bbox.y >= -bleed &&
    bbox.x + bbox.w <= frameW + bleed &&
    bbox.y + bbox.h <= frameH + bleed;
  if (!inFrame) return false;
  const aspect = Math.max(bbox.w / bbox.h, bbox.h / bbox.w);
  if (aspect > MAX_LIP_ASPECT) return false;
  const pct = polygonArea(outer_px) / (frameW * frameH);
  return pct >= MIN_LIP_AREA_PCT && pct <= MAX_LIP_AREA_PCT;
}

function lipsArePresentHysteresis(outer_px, frameW, frameH, wasVisible) {
  if (!outer_px || outer_px.length < 8) return false;
  const bbox = computeBBox(outer_px);
  if (bbox.w < 4 || bbox.h < 4) return false;

  const bleed = 2;
  const inFrame =
    bbox.x >= -bleed &&
    bbox.y >= -bleed &&
    bbox.x + bbox.w <= frameW + bleed &&
    bbox.y + bbox.h <= frameH + bleed;
  if (!inFrame) return false;

  const aspect = Math.max(bbox.w / bbox.h, bbox.h / bbox.w);
  if (aspect > MAX_LIP_ASPECT) return false;

  const pct = polygonArea(outer_px) / (frameW * frameH);

  const minOn = MIN_LIP_AREA_PCT * LIP_AREA_ON_MULT;
  const minOff = MIN_LIP_AREA_PCT * LIP_AREA_OFF_MULT;
  const maxOn = MAX_LIP_AREA_PCT * 0.95;
  const maxOff = MAX_LIP_AREA_PCT * 1.05;

  if (wasVisible) {
    return pct >= minOff && pct <= maxOff;
  } else {
    return pct >= minOn && pct <= maxOn;
  }
}

function smoothTemporal(prev, curr, alpha) {
  if (!prev || prev.length !== curr.length) return curr.slice();
  return curr.map((p, i) => ({
    x: prev[i].x * (1 - alpha) + p.x * alpha,
    y: prev[i].y * (1 - alpha) + p.y * alpha,
  }));
}

function stabilizeWithMotion(prev, curr) {
  if (!prev || prev.length !== curr.length) return curr;
  const cPrev = computeCentroid(prev);
  const cCurr = computeCentroid(curr);
  const bbPrev = computeBBox(prev);
  const bbCurr = computeBBox(curr);
  const sPrev = Math.max(bbPrev.w, bbPrev.h) || 1;
  const sCurr = Math.max(bbCurr.w, bbCurr.h) || 1;
  const scale = Math.max(0.9, Math.min(1.15, sCurr / sPrev));
  const n = curr.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const pPrev = prev[i];
    const warpedPrev = {
      x: cCurr.x + (pPrev.x - cPrev.x) * scale,
      y: cCurr.y + (pPrev.y - cPrev.y) * scale,
    };
    out[i] = {
      x: warpedPrev.x * 0.4 + curr[i].x * 0.6,
      y: warpedPrev.y * 0.4 + curr[i].y * 0.6,
    };
  }
  return out;
}

/* ============================ AR INIT HELPERS ============================= */
function initFaceMeshIfReady(faceMeshRef, latestResultsRef, lastGoodLandmarksRef) {
  if (faceMeshRef.current || !window.FaceMesh) return false;
  const faceMesh = new window.FaceMesh({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.72,
    selfieMode: false,
  });
  faceMesh.onResults((results) => {
    latestResultsRef.current = results;
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      lastGoodLandmarksRef.current = results.multiFaceLandmarks[0];
    }
  });
  faceMeshRef.current = faceMesh;
  return true;
}

function initHandsIfReady(handsRef, latestHandsRef) {
  if (handsRef.current || !window.Hands) return false;
  const hands = new window.Hands({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 0,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
    selfieMode: false,
  });
  hands.onResults((results) => {
    latestHandsRef.current = results;
  });
  handsRef.current = hands;
  return true;
}

/* ============================ MOBILE HELPERS ============================== */
function isiOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

const isMobileUA = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;

async function ensureVideoReady(video) {
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.muted = true;
  try {
    await video.play();
  } catch (_) {}
  if (video.readyState >= 2) return;
  await new Promise((resolve) => {
    const onCanPlay = () => {
      video.removeEventListener("canplay", onCanPlay);
      resolve();
    };
    video.addEventListener("canplay", onCanPlay, { once: true });
  });
}

async function tryOpenStream() {
  const mobile = isMobileUA();
  const tries = [
    {
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: mobile ? 960 : 1280 },
        height: { ideal: mobile ? 540 : 720 },
        frameRate: { ideal: 30, max: mobile ? 30 : 60 },
      },
      audio: false,
    },
    { video: { facingMode: "user" }, audio: false },
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: true, audio: false },
  ];
  let lastError = null;
  for (const c of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia(c);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("getUserMedia failed");
}

/* =========================== SMOKE TESTS (DEV) ============================ */
const __testsRan = { v: false };
function runSmokeTests() {
  if (__testsRan.v) return;
  __testsRan.v = true;
  try {
    const rr = hexToRgb("#ff0000");
    console.assert(rr.r === 255 && rr.g === 0 && rr.b === 0, "hexToRgb failed");
    const rr3 = hexToRgb("#0f0");
    console.assert(rr3.g === 255, "hexToRgb 3-digit failed");
    const rrt = hexToRgb("transparent");
    console.assert(rrt.a === 0, "hexToRgb transparent failed");

    const hsl = rgbToHsl(120, 60, 30);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    console.assert(
      Math.abs(rgb.r - 120) < 10 &&
        Math.abs(rgb.g - 60) < 10 &&
        Math.abs(rgb.b - 30) < 10,
      "HSL round trip approx failed"
    );

    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    console.assert(Math.abs(polygonArea(pts) - 100) < 1e-6, "polygonArea failed");
    const bb = computeBBox(pts);
    console.assert(
      bb.w === 10 && bb.h === 10 && bb.x === 0 && bb.y === 0,
      "computeBBox failed"
    );
    const inter = rectIntersectArea(
      { x: 0, y: 0, w: 5, h: 5 },
      { x: 3, y: 3, w: 5, h: 5 }
    );
    console.assert(inter === 4, "rectIntersectArea failed");
  } catch (e) {
    console.warn("Smoke tests error:", e);
  }
}

/* =============================== COMPONENT ================================ */
export default function VirtualTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const backCanvasRef = useRef(null);

  // Offscreen tinted canvases for dual-shade mode
  const tintCanvasLeftRef = useRef(null);
  const tintCanvasRightRef = useRef(null);

  const faceMeshRef = useRef(null);
  const handsRef = useRef(null);

  const streamRef = useRef(null);
  const afRef = useRef(null);

  const latestResultsRef = useRef(null);
  const latestHandsRef = useRef(null);

  const sendingFaceRef = useRef(false);
  const sendingHandsRef = useRef(false);

  const lastGoodLandmarksRef = useRef(null);
  const smoothedLandmarksRef = useRef(null);

  const maskCanvasRef = useRef(null);
  const [error, setError] = useState("");

  const [started, setStarted] = useState(false);
  const wantsRunningRef = useRef(false);

  // === Dual-shade state ===
  const [leftShade, setLeftShade] = useState(LIPSTICK_SHADES[13]);
  const [rightShade, setRightShade] = useState(LIPSTICK_SHADES[0]);
  const [activeSide, setActiveSide] = useState("left");

  // Compact compare picker state
  const [comparePickerOpen, setComparePickerOpen] = useState(false);

  const leftColorRef = useRef(leftShade.color);
  const rightColorRef = useRef(rightShade.color);
  useEffect(() => {
    leftColorRef.current = leftShade.color;
  }, [leftShade]);
  useEffect(() => {
    rightColorRef.current = rightShade.color;
  }, [rightShade]);

  const [snapshot, setSnapshot] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Shade badge
  const [showShadeBadge, setShowShadeBadge] = useState(false);
  const badgeTimerRef = useRef(null);
  const shadeScrollerRef = useRef(null);
  const shadeButtonsRef = useRef({});
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobileView(mq.matches);
    update();
    const listener = () => update();
    mq.addEventListener?.("change", listener);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener?.("change", listener);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Consent state
  const [showConsent, setShowConsent] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);

  // Split (dual) state
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareRatio, setCompareRatio] = useState(0.5);
  const compareEnabledRef = useRef(compareEnabled);
  const compareRatioRef = useRef(compareRatio);
  const compareDragHandlersRef = useRef({ move: null, up: null });
  const comparePointerIdRef = useRef(null);

  useEffect(() => {
    compareEnabledRef.current = compareEnabled;
  }, [compareEnabled]);
  useEffect(() => {
    compareRatioRef.current = compareRatio;
  }, [compareRatio]);

  const activeShade = activeSide === "left" ? leftShade : rightShade;

  // Keep active shade centered
  useEffect(() => {
    const scroller = shadeScrollerRef.current;
    const activeBtn = shadeButtonsRef.current[activeShade.id];
    if (!scroller || !activeBtn) return;
    const target =
      activeBtn.offsetLeft -
      scroller.clientWidth / 2 +
      activeBtn.offsetWidth / 2;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const clamped = Math.min(Math.max(target, 0), Math.max(0, maxScroll));
    scroller.scrollTo({ left: clamped, behavior: "smooth" });
  }, [activeShade, started]);

  const scrollShades = (direction) => {
    const scroller = shadeScrollerRef.current;
    if (!scroller) return;
    const amount = scroller.clientWidth * SHADE_SCROLL_FRACTION || 0;
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  // Compare rail scroller
  const compareScrollerRef = useRef(null);
  const scrollCompareRail = (dir) => {
    const el = compareScrollerRef.current;
    if (!el) return;
    const amt = Math.max(160, Math.round(el.clientWidth * 0.5));
    el.scrollBy({ left: dir * amt, behavior: "smooth" });
  };

  const handleConsentAccept = () => {
    setConsentAccepted(true);
    setConsentDeclined(false);
    setShowConsent(false);
  };

  const handleConsentDecline = () => {
    setConsentAccepted(false);
    setConsentDeclined(true);
    setShowConsent(false);
  };

  const reopenConsent = () => {
    setShowConsent(true);
    setConsentDeclined(false);
  };

  // Clamp split
  const clampCompare = (value) => Math.min(0.93, Math.max(0.07, value));

  const updateComparePosition = (clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = clampCompare((clientX - rect.left) / rect.width);
    compareRatioRef.current = ratio;
    setCompareRatio(ratio);
  };

  const handleComparePointerDown = (event) => {
    event.preventDefault();
    const target = event.currentTarget;
    if (!compareEnabledRef.current) {
      compareEnabledRef.current = true;
      setCompareEnabled(true);
    }
    updateComparePosition(event.clientX);
    comparePointerIdRef.current = event.pointerId;
    if (target?.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch (_) {}
    }

    const onMove = (e) => {
      if (comparePointerIdRef.current !== e.pointerId) return;
      if (e.cancelable) e.preventDefault();
      updateComparePosition(e.clientX);
    };
    const onUp = (e) => {
      if (comparePointerIdRef.current !== e.pointerId) return;
      comparePointerIdRef.current = null;
      if (target?.releasePointerCapture) {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      updateComparePosition(e.clientX);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      compareDragHandlersRef.current = { move: null, up: null };
    };

    compareDragHandlersRef.current = { move: onMove, up: onUp };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const toggleCompare = () => {
    setCompareEnabled((prev) => {
      const next = !prev;
      compareEnabledRef.current = next;
      if (next) {
        const target = 0.5;
        compareRatioRef.current = target;
        setCompareRatio(target);
        setComparePickerOpen(false);
      } else {
        setComparePickerOpen(false);
      }
      return next;
    });
  };

  useEffect(() => {
    const { move, up } = compareDragHandlersRef.current;
    if (move) window.removeEventListener("pointermove", move);
    if (up) window.removeEventListener("pointerup", up);
  }, []);

  // Fade control
  const tintAlphaRef = useRef(0);
  const targetAlphaRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Occlusion state
  const goodStreakRef = useRef(0);
  const badStreakRef = useRef(0);
  const holdFramesRef = useRef(0);
  const occlAreaEmaRef = useRef(null);
  const occlCentroidEmaRef = useRef(null);
  const occlStreakRef = useRef(0);
  const occludedRef = useRef(false);
  const handFreeStreakRef = useRef(0);

  // Anti-flicker
  const prevOuterCssRef = useRef(null);
  const prevInnerCssRef = useRef(null);
  const prevOuterPxRef = useRef(null);
  const prevInnerPxRef = useRef(null);
  const edgeFeatherEmaRef = useRef(null);

  // Visibility + hand occlusion debounce
  const lipsVisibleRef = useRef(false);
  const handOverlapOnStreakRef = useRef(0);

  useEffect(() => {
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = prev;
    };
  }, []);

  // Eager load scripts
  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = FACE_MESH_URLS[0];
    s1.crossOrigin = "anonymous";
    s1.async = true;
    s1.defer = true;
    s1.onerror = () =>
      setError("Failed to load FaceMesh. Check network/HTTPS.");
    document.head.appendChild(s1);

    const s2 = document.createElement("script");
    s2.src = HANDS_URLS[0];
    s2.crossOrigin = "anonymous";
    s2.async = true;
    s2.defer = true;
    s2.onerror = () =>
      setError("Failed to load Hands. Check network/HTTPS.");
    document.head.appendChild(s2);

    return () => {
      if (s1 && s1.parentNode) s1.parentNode.removeChild(s1);
      if (s2 && s2.parentNode) s2.parentNode.removeChild(s2);
    };
  }, []);

  // Poll init
  useEffect(() => {
    let cancelled = false;
    const POLL_MS = 350;
    const tryInit = () => {
      initFaceMeshIfReady(faceMeshRef, latestResultsRef, lastGoodLandmarksRef);
      initHandsIfReady(handsRef, latestHandsRef);
      if (!cancelled && (!faceMeshRef.current || !handsRef.current)) {
        setTimeout(tryInit, POLL_MS);
      }
    };
    tryInit();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-resume when returning to tab
  useEffect(() => {
    const onVis = async () => {
      if (document.hidden) {
        stopCamera();
      } else if (wantsRunningRef.current) {
        await startCamera();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Shade badge visibility logic
  useEffect(() => {
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    setShowShadeBadge(true);
    badgeTimerRef.current = setTimeout(
      () => setShowShadeBadge(false),
      1600
    );
    return () => {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, [activeShade]);

  useEffect(() => {
    if (started) {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      setShowShadeBadge(true);
      badgeTimerRef.current = setTimeout(
        () => setShowShadeBadge(false),
        1600
      );
    }
  }, [started]);

  function stopCamera() {
    if (afRef.current) {
      if (
        "cancelVideoFrameCallback" in HTMLVideoElement.prototype &&
        videoRef.current?.cancelVideoFrameCallback
      ) {
        try {
          videoRef.current.cancelVideoFrameCallback(afRef.current);
        } catch {}
      } else {
        cancelAnimationFrame(afRef.current);
      }
      afRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    smoothedLandmarksRef.current = null;
    goodStreakRef.current = 0;
    badStreakRef.current = LIP_OFF_FRAMES;
    holdFramesRef.current = 0;

    occlAreaEmaRef.current = null;
    occlCentroidEmaRef.current = null;
    occlStreakRef.current = 0;
    occludedRef.current = false;
    handFreeStreakRef.current = 0;

    prevOuterCssRef.current = null;
    prevInnerCssRef.current = null;
    prevOuterPxRef.current = null;
    prevInnerPxRef.current = null;

    edgeFeatherEmaRef.current = null;

    targetAlphaRef.current = 0;
    tintAlphaRef.current = 0;
    lastTimeRef.current = performance.now();

    window.removeEventListener("resize", setupCanvas);
    window.removeEventListener("orientationchange", setupCanvas);

    compareEnabledRef.current = false;
    setCompareEnabled(false);
    setStarted(false);
  }

  function handleExit() {
    stopCamera();
    wantsRunningRef.current = false;
    setSnapshot(null);
    setError("");
    compareEnabledRef.current = false;
    setCompareEnabled(false);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera not supported in this browser. Try Chrome/Edge on Android or Safari 15+ on iOS."
      );
      return;
    }

    if (!window.FaceMesh || !window.Hands) {
      setError("Loading vision models…");
      const ok = await ensureModels();
      if (!ok) {
        setError(
          "Couldn’t load vision models. Allow cdn.jsdelivr.net or unpkg.com (disable ad-block for this page) and ensure your CSP allows those domains."
        );
        return;
      }
      setError("");
      initFaceMeshIfReady(faceMeshRef, latestResultsRef, lastGoodLandmarksRef);
      initHandsIfReady(handsRef, latestHandsRef);
    }

    wantsRunningRef.current = true;

    try {
      stopCamera();
      const stream = await tryOpenStream();
      streamRef.current = stream;

      const video = videoRef.current;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.muted = true;
      video.srcObject = stream;

      await ensureVideoReady(video);

      setupCanvas();
      setStarted(true);
      startProcessing();

      window.addEventListener("resize", setupCanvas);
      window.addEventListener("orientationchange", setupCanvas);
    } catch (e) {
      console.error(e);
      const msg = String(e?.name || e?.message || e);
      if (/NotAllowedError|Permission/i.test(msg)) {
        setError(
          isiOS()
            ? "Camera permission denied. Settings > Safari > Camera → Allow, then reload."
            : "Camera permission denied. Allow camera permissions and reload."
        );
      } else if (/NotFoundError|DevicesNotFound/i.test(msg)) {
        setError("No camera device found.");
      } else if (/OverconstrainedError|Constraint/i.test(msg)) {
        setError("Camera constraints not supported. Trying a simpler setup might help.");
      } else {
        setError("Camera access failed. Use HTTPS and a supported mobile browser.");
      }
      stopCamera();
    }
  }

  function setupCanvas() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const DPR = Math.min(
      window.devicePixelRatio || 1,
      isMobileUA() ? DPR_MOBILE : DPR_DESKTOP
    );
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = Math.max(2, Math.floor(w * DPR));
    canvas.height = Math.max(2, Math.floor(h * DPR));

    const ctx = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: true,
    });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (!backCanvasRef.current) backCanvasRef.current = document.createElement("canvas");
    backCanvasRef.current.width = canvas.width;
    backCanvasRef.current.height = canvas.height;

    if (!tintCanvasLeftRef.current)
      tintCanvasLeftRef.current = document.createElement("canvas");
    tintCanvasLeftRef.current.width = canvas.width;
    tintCanvasLeftRef.current.height = canvas.height;

    if (!tintCanvasRightRef.current)
      tintCanvasRightRef.current = document.createElement("canvas");
    tintCanvasRightRef.current.width = canvas.width;
    tintCanvasRightRef.current.height = canvas.height;

    if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement("canvas");
  }

  function startProcessing() {
    const video = videoRef.current;
    const frontCanvas = canvasRef.current;
    const frontCtx = frontCanvas.getContext("2d", { willReadFrequently: true });
    const backCanvas = backCanvasRef.current;
    const backCtx = backCanvas.getContext("2d", { willReadFrequently: true });

    const tintLeft = tintCanvasLeftRef.current;
    const tintRight = tintCanvasRightRef.current;
    const tintLeftCtx = tintLeft.getContext("2d", { willReadFrequently: true });
    const tintRightCtx = tintRight.getContext("2d", { willReadFrequently: true });

    const DPR = Math.min(
      window.devicePixelRatio || 1,
      isMobileUA() ? DPR_MOBILE : DPR_DESKTOP
    );

    const tintOnCtx = (targetCtx, color, drawOuter, drawInner, w, h) => {
      if (!drawOuter || !drawInner) return;
      const bbox = computeBBox(drawOuter);
      const pad = Math.min(
        MAX_BBOX_PAD,
        Math.max(2, Math.round(Math.max(bbox.w, bbox.h) * 0.06))
      );
      const bx = Math.max(0, Math.floor(bbox.x - pad));
      const by = Math.max(0, Math.floor(bbox.y - pad));
      const bw = Math.min(w - bx, Math.ceil(bbox.w + pad * 2));
      const bh = Math.min(h - by, Math.ceil(bbox.h + pad * 2));

      const sx = Math.floor(bx * DPR);
      const sy = Math.floor(by * DPR);
      const sw = Math.max(1, Math.floor(bw * DPR));
      const sh = Math.max(1, Math.floor(bh * DPR));
      const frame = targetCtx.getImageData(sx, sy, sw, sh);

      const mCanvas = maskCanvasRef.current;
      mCanvas.width = sw;
      mCanvas.height = sh;
      const mctx = mCanvas.getContext("2d", { willReadFrequently: true });
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, sw, sh);
      mctx.save();
      const toDevice = (p) => ({ x: (p.x - bx) * DPR, y: (p.y - by) * DPR });
      const outerD = (drawOuter || []).map(toDevice);
      const innerD = (drawInner || []).map(toDevice);
      const maskPath = makePathFromRings(outerD, innerD);

      let rawFeather = Math.max(
        1.2,
        Math.min(2.6, Math.max(bw * DPR, bh * DPR) * 0.005)
      );
      rawFeather *= 1 + SOFT_EDGE_BOOST;
      if (edgeFeatherEmaRef.current == null) edgeFeatherEmaRef.current = rawFeather;
      const edgeFeatherPx = (edgeFeatherEmaRef.current =
        edgeFeatherEmaRef.current * (1 - FEATHER_EMA_ALPHA) +
        rawFeather * FEATHER_EMA_ALPHA);

      mctx.filter = `blur(${edgeFeatherPx}px)`;
      mctx.fillStyle = "#fff";
      mctx.fill(maskPath, "evenodd");
      mctx.restore();
      const mask = mctx.getImageData(0, 0, sw, sh);

      const { r: tr, g: tg, b: tb } = hexToRgb(color);
      const thsl = rgbToHsl(tr, tg, tb);
      const data = frame.data;
      const mdata = mask.data;
      for (let i = 0; i < data.length; i += 4) {
        const ma = (mdata[i + 3] / 255) * tintAlphaRef.current;
        if (ma < 0.01) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const { l } = rgbToHsl(r, g, b);
        const a = clamp01(BASE_OPACITY + SHADOW_BOOST * (0.5 - l)) * ma;
        const nrgb = hslToRgb(thsl.h, thsl.s, l);
        data[i] = Math.round(nrgb.r * a + r * (1 - a));
        data[i + 1] = Math.round(nrgb.g * a + g * (1 - a));
        data[i + 2] = Math.round(nrgb.b * a + b * (1 - a));
      }
      targetCtx.putImageData(frame, sx, sy);
    };

    const step = async () => {
      const now = performance.now();
      const dt = Math.max(0.001, (now - (lastTimeRef.current || now)) / 1000);
      lastTimeRef.current = now;

      // Always run hands, freeze face during occlusion
      if (
        video.readyState >= 2 &&
        !sendingHandsRef.current &&
        handsRef.current
      ) {
        try {
          sendingHandsRef.current = true;
          await handsRef.current.send({ image: video });
        } finally {
          sendingHandsRef.current = false;
        }
      }
      if (
        !occludedRef.current &&
        video.readyState >= 2 &&
        !sendingFaceRef.current &&
        faceMeshRef.current
      ) {
        try {
          sendingFaceRef.current = true;
          await faceMeshRef.current.send({ image: video });
        } finally {
          sendingFaceRef.current = false;
        }
      }

      const w = frontCanvas.width / DPR;
      const h = frontCanvas.height / DPR;

      // Draw mirrored camera to back buffer
      backCtx.setTransform(1, 0, 0, 1, 0, 0);
      backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);
      backCtx.setTransform(-DPR, 0, 0, DPR, backCanvas.width, 0);
      if (video.readyState >= 2) backCtx.drawImage(video, 0, 0, w, h);

      // Smooth landmarks
      const raw = latestResultsRef.current?.multiFaceLandmarks?.[0] || null;
      if (raw && !occludedRef.current) {
        if (!smoothedLandmarksRef.current) {
          smoothedLandmarksRef.current = raw.map((p) => ({
            x: p.x,
            y: p.y,
            z: p.z || 0,
          }));
        } else {
          for (let i = 0; i < raw.length; i++) {
            const s = smoothedLandmarksRef.current[i];
            const c = raw[i];
            if (LIP_LANDMARK_INDICES.has(i)) {
              const dx = c.x - s.x;
              const dy = c.y - s.y;
              const planar = Math.hypot(dx, dy);
              const ratio = Math.min(1, planar / POSITION_SNAP_THRESHOLD);
              const blend =
                MIN_LIP_SMOOTHING +
                (MAX_LIP_SMOOTHING - MIN_LIP_SMOOTHING) * ratio;
              s.x += (c.x - s.x) * blend + dx * 0.08;
              s.y += (c.y - s.y) * blend + dy * 0.08;
              s.z += (c.z - s.z) * (blend * 0.5);
            } else {
              s.x += (c.x - s.x) * BASE_SMOOTHING;
              s.y += (c.y - s.y) * BASE_SMOOTHING;
              s.z += (c.z - s.z) * (BASE_SMOOTHING * 0.5);
            }
          }
        }
      }

      const drawLm =
        smoothedLandmarksRef.current || lastGoodLandmarksRef.current;
      if (drawLm) {
        let outerU = getLipPoints(drawLm, UPPER_LIP_OUTER, w, h);
        let outerL = getLipPoints(drawLm, LOWER_LIP_OUTER, w, h);
        let innerU = getLipPoints(drawLm, UPPER_LIP_INNER, w, h);
        let innerL = getLipPoints(drawLm, LOWER_LIP_INNER, w, h);
        let outerRing = smoothPolyline(
          [...outerU, ...outerL.slice().reverse()],
          0
        );
        let innerRing = smoothPolyline(
          [...innerU, ...innerL.slice().reverse()],
          0
        );

        let outerU_px = getLipPointsPx(drawLm, UPPER_LIP_OUTER, w, h);
        let outerL_px = getLipPointsPx(drawLm, LOWER_LIP_OUTER, w, h);
        let innerU_px = getLipPointsPx(drawLm, UPPER_LIP_INNER, w, h);
        let innerL_px = getLipPointsPx(drawLm, LOWER_LIP_INNER, w, h);

        const lipBox = computeBBox([...outerU_px, ...outerL_px]);
        const upBias = Math.min(UPPER_Y_BIAS_MAX, lipBox.h * 0.02);
        outerU_px = outerU_px.map((p) => ({ x: p.x, y: p.y - upBias }));

        let outer_px = smoothPolyline(
          [...outerU_px, ...outerL_px.slice().reverse()],
          0
        );
        let inner_px = smoothPolyline(
          [...innerU_px, ...innerL_px.slice().reverse()],
          0
        );

        const scalePoly = (poly, s) => {
          const c = computeCentroid(poly);
          return poly.map((p) => ({
            x: c.x + (p.x - c.x) * s,
            y: c.y + (p.y - c.y) * s,
          }));
        };
        outer_px = scalePoly(outer_px, OUTER_SCALE);
        inner_px = scalePoly(inner_px, INNER_SCALE);

        outer_px = stabilizeWithMotion(prevOuterPxRef.current, outer_px);
        inner_px = stabilizeWithMotion(prevInnerPxRef.current, inner_px);
        outerRing = stabilizeWithMotion(prevOuterCssRef.current, outerRing);
        innerRing = stabilizeWithMotion(prevInnerCssRef.current, innerRing);

        outer_px = smoothTemporal(prevOuterPxRef.current, outer_px, MASK_EASE_ALPHA);
        inner_px = smoothTemporal(prevInnerPxRef.current, inner_px, MASK_EASE_ALPHA);
        outerRing = smoothTemporal(
          prevOuterCssRef.current,
          outerRing,
          MASK_EASE_ALPHA
        );
        innerRing = smoothTemporal(
          prevInnerCssRef.current,
          innerRing,
          MASK_EASE_ALPHA
        );

        // ==== TRUST GATE: prevent lipstick from jumping off the mouth ====
        // Only apply when previous frame had visible lips.
        if (
          lipsVisibleRef.current &&
          prevOuterPxRef.current &&
          prevOuterPxRef.current.length === outer_px.length
        ) {
          const prevC = computeCentroid(prevOuterPxRef.current);
          const currC = computeCentroid(outer_px);
          const diag = Math.max(1, Math.hypot(w, h));
          const centroidShiftNorm =
            Math.hypot(currC.x - prevC.x, currC.y - prevC.y) / diag;

          if (centroidShiftNorm > MAX_LIP_JUMP_NORM) {
            // Frame looks like a tracking glitch; keep last stable lips.
            outer_px = prevOuterPxRef.current.slice();
            inner_px = (prevInnerPxRef.current || inner_px).slice();
            outerRing = (prevOuterCssRef.current || outerRing).slice();
            innerRing = (prevInnerCssRef.current || innerRing).slice();
          }
        }
        // ==================================================================

        const hasRaw =
          !!latestResultsRef.current?.multiFaceLandmarks?.[0];

        const lipsVisibleNow =
          hasRaw &&
          lipsArePresentHysteresis(outer_px, w, h, lipsVisibleRef.current);

        const handBoxes = getHandBBoxesMirrored(
          latestHandsRef.current,
          w,
          h,
          HAND_BBOX_PAD_PX
        );
        const lipRect = rectFromPoints(outer_px);
        const lipArea = rectArea(lipRect);
        const handOverlapNow = handBoxes.some(
          (hb) =>
            rectIntersectArea(hb, lipRect) >= lipArea * HAND_OVERLAP_RATIO
        );

        const outerArea = polygonArea(outer_px);
        if (occlAreaEmaRef.current == null)
          occlAreaEmaRef.current = outerArea;
        occlAreaEmaRef.current =
          occlAreaEmaRef.current * (1 - AREA_EMA_ALPHA) +
          outerArea * AREA_EMA_ALPHA;

        const cNow = computeCentroid(outer_px);
        const diag = Math.hypot(w, h);
        if (occlCentroidEmaRef.current == null)
          occlCentroidEmaRef.current = { ...cNow };
        const prevEx = { ...occlCentroidEmaRef.current };
        occlCentroidEmaRef.current.x +=
          (cNow.x - occlCentroidEmaRef.current.x) * 0.25;
        occlCentroidEmaRef.current.y +=
          (cNow.y - occlCentroidEmaRef.current.y) * 0.25;
        const headVel =
          Math.hypot(cNow.x - prevEx.x, cNow.y - prevEx.y) / diag;
        const jitter =
          Math.hypot(
            cNow.x - occlCentroidEmaRef.current.x,
            cNow.y - occlCentroidEmaRef.current.y
          ) / diag;
        const jitterSpike = jitter > OCCL_JITTER_THRESH;
        const fastHeadMove = headVel > HEAD_VEL_THRESH;

        const lipZ = Array.from(LIP_LANDMARK_INDICES).map(
          (i) => drawLm[i].z || 0
        );
        const zStd = stddev(lipZ);
        const zNoisy = zStd > OCCL_Z_STD_THRESH;

        const softOcclusionNow =
          (outerArea <
            occlAreaEmaRef.current * (1 - OCCL_AREA_DROP) &&
            !fastHeadMove) ||
          (jitterSpike && !fastHeadMove) ||
          zNoisy;

        let HARD_OCCLUSION;
        if (ONLY_HIDE_ON_HAND) {
          if (handOverlapNow) {
            handOverlapOnStreakRef.current = Math.min(
              HAND_OCCL_ON_FRAMES,
              handOverlapOnStreakRef.current + 1
            );
          } else {
            handOverlapOnStreakRef.current = 0;
          }
          HARD_OCCLUSION =
            handOverlapNow ||
            handOverlapOnStreakRef.current >= HAND_OCCL_ON_FRAMES;
          occlStreakRef.current = 0;
        } else {
          const occludedNow = hasRaw && (handOverlapNow || softOcclusionNow);
          if (occludedNow || !lipsVisibleNow) occlStreakRef.current++;
          else occlStreakRef.current = 0;
          HARD_OCCLUSION =
            handOverlapNow || occlStreakRef.current >= OCCL_MIN_FRAMES;
        }

        if (!handOverlapNow) handFreeStreakRef.current++;
        else handFreeStreakRef.current = 0;
        if (handFreeStreakRef.current >= 2) occludedRef.current = false;

        const anyColorSelected = compareEnabledRef.current
          ? leftColorRef.current !== "transparent" ||
            rightColorRef.current !== "transparent"
          : leftColorRef.current !== "transparent";

        const shouldShow =
          (lipsVisibleNow && !HARD_OCCLUSION) || holdFramesRef.current > 0;
        targetAlphaRef.current =
          anyColorSelected && shouldShow ? 1 : 0;

        if (lipsVisibleNow && !HARD_OCCLUSION) {
          goodStreakRef.current = Math.min(
            LIP_ON_FRAMES,
            goodStreakRef.current + 1
          );
          badStreakRef.current = 0;
          holdFramesRef.current = STICKY_HOLD_FRAMES;
        } else {
          badStreakRef.current = Math.min(
            LIP_OFF_FRAMES,
            badStreakRef.current + 1
          );
          goodStreakRef.current = 0;
          if (holdFramesRef.current > 0) holdFramesRef.current--;
        }

        if (HARD_OCCLUSION) {
          occludedRef.current = true;
          holdFramesRef.current = 0;
          targetAlphaRef.current = 0;
        }

        lipsVisibleRef.current = lipsVisibleNow;

        if (lipsVisibleNow) {
          prevOuterPxRef.current = outer_px.slice();
          prevInnerPxRef.current = inner_px.slice();
          prevOuterCssRef.current = outerRing.slice();
          prevInnerCssRef.current = innerRing.slice();
        }

        // Build left/right tinted canvases
        tintLeftCtx.setTransform(1, 0, 0, 1, 0, 0);
        tintRightCtx.setTransform(1, 0, 0, 1, 0, 0);
        tintLeftCtx.clearRect(0, 0, tintLeft.width, tintLeft.height);
        tintRightCtx.clearRect(0, 0, tintRight.width, tintRight.height);
        tintLeftCtx.drawImage(backCanvas, 0, 0);
        tintRightCtx.drawImage(backCanvas, 0, 0);

        const alpha = tintAlphaRef.current;
        const willDraw =
          alpha > 0.02 || targetAlphaRef.current > 0.02;
        if (willDraw && !HARD_OCCLUSION) {
          const drawOuter = outer_px || prevOuterPxRef.current;
          const drawInner =
            inner_px || prevInnerPxRef.current || inner_px;
          if (drawOuter && drawInner) {
            const lc = leftColorRef.current;
            const rc = rightColorRef.current;
            if (lc !== "transparent")
              tintOnCtx(tintLeftCtx, lc, drawOuter, drawInner, w, h);
            if (compareEnabledRef.current) {
              const rightShadeColor =
                rc !== "transparent" ? rc : lc;
              if (rightShadeColor !== "transparent")
                tintOnCtx(
                  tintRightCtx,
                  rightShadeColor,
                  drawOuter,
                  drawInner,
                  w,
                  h
                );
            } else {
              if (lc !== "transparent")
                tintOnCtx(tintRightCtx, lc, drawOuter, drawInner, w, h);
            }
          }
        } else if (HARD_OCCLUSION) {
          tintAlphaRef.current *= 0.5;
        }

        const tau =
          (targetAlphaRef.current > tintAlphaRef.current
            ? FADE_IN_MS
            : FADE_OUT_MS) / 1000;
        const k = 1 - Math.exp(-dt / Math.max(0.001, tau));
        tintAlphaRef.current +=
          (targetAlphaRef.current - tintAlphaRef.current) * k;
      }

      // Present
      frontCtx.setTransform(1, 0, 0, 1, 0, 0);
      frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

      if (compareEnabledRef.current) {
        const splitRatio = clampCompare(compareRatioRef.current);
        const splitPx = frontCanvas.width * splitRatio;

        frontCtx.save();
        frontCtx.beginPath();
        frontCtx.rect(0, 0, splitPx, frontCanvas.height);
        frontCtx.clip();
        frontCtx.drawImage(tintLeft, 0, 0);
        frontCtx.restore();

        frontCtx.save();
        frontCtx.beginPath();
        frontCtx.rect(
          splitPx,
          0,
          frontCanvas.width - splitPx,
          frontCanvas.height
        );
        frontCtx.clip();
        frontCtx.drawImage(tintRight, 0, 0);
        frontCtx.restore();

        frontCtx.save();
        frontCtx.fillStyle = "rgba(255,255,255,0.85)";
        frontCtx.fillRect(splitPx - 0.75, 0, 1.5, frontCanvas.height);
        frontCtx.restore();
      } else {
        frontCtx.drawImage(tintLeft, 0, 0);
      }

      if (
        "requestVideoFrameCallback" in HTMLVideoElement.prototype &&
        videoRef.current?.requestVideoFrameCallback
      ) {
        afRef.current = videoRef.current.requestVideoFrameCallback(() => step());
      } else {
        afRef.current = requestAnimationFrame(step);
      }
    };

    step();
  }

  function getLipPoints(landmarks, indices, w, h) {
    return indices.map((i) => ({
      x: landmarks[i].x * w,
      y: landmarks[i].y * h,
    }));
  }

  function getLipPointsPx(landmarks, indices, w, h) {
    return indices.map((i) => ({
      x: w - landmarks[i].x * w,
      y: landmarks[i].y * h,
    }));
  }

  function getHandBBoxesMirrored(handsResults, w, h, padPx = 0) {
    const boxes = [];
    if (!handsResults || !handsResults.multiHandLandmarks) return boxes;
    for (const lmArr of handsResults.multiHandLandmarks) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const lm of lmArr) {
        const x = w - lm.x * w;
        const y = lm.y * h;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      const r = {
        x: minX,
        y: minY,
        w: Math.max(1, maxX - minX),
        h: Math.max(1, maxY - minY),
      };
      boxes.push(rectPad(r, padPx));
    }
    return boxes;
  }

  function takeSnapshot() {
    const canvas = canvasRef.current;
    if (canvas) {
      const DPR = Math.min(
        window.devicePixelRatio || 1,
        isMobileUA() ? DPR_MOBILE : DPR_DESKTOP
      );
      const tmp = document.createElement("canvas");
      tmp.width = Math.floor(canvas.width / DPR);
      tmp.height = Math.floor(canvas.height / DPR);
      const tctx = tmp.getContext("2d");
      tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      setSnapshot(tmp.toDataURL("image/png"));
    }
  }

  useEffect(() => {
    runSmokeTests();
  }, []);

  useEffect(() => {
    document.body.classList.add("ar-no-scroll");
    return () => document.body.classList.remove("ar-no-scroll");
  }, []);

  const formatShadeLine = (shade) => {
    const displayName = shade.id === 0 ? "Natural Finish" : shade.name;
    const code =
      shade.code && String(shade.code).trim().length
        ? String(shade.code).trim()
        : null;
    return code ? `${code} - ${displayName}` : displayName;
  };

  const leftShadeLine = formatShadeLine(leftShade);
  const rightShadeLine = formatShadeLine(rightShade);
  const comparePreviewShade =
    rightShade?.id === 0 || !rightShade ? leftShade : rightShade;

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-black text-white font-sans overflow-hidden touch-manipulation select-none"
      style={{ minHeight: "100dvh" }}
    >
      <div className="relative w-full h-full bg-black">
        <video ref={videoRef} className="hidden" playsInline muted autoPlay />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {consentAccepted && !showConsent && (
          <div className="absolute top-6 right-3 sm:top-9 sm:right-6 z-40 pointer-events-none">
            <button
              type="button"
              onClick={handleExit}
              className="pointer-events-auto relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/25 shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:bg-black/85 transition-colors"
              aria-label="Close virtual try-on"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {started && !snapshot && consentAccepted && (
          <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 text-center z-30 pointer-events-none">
            <div className="text-xs sm:text-sm tracking-[0.3em] uppercase text-white/70">
              Marvelle Beauté
            </div>
            <div className="text-base sm:text-lg text-white font-semibold tracking-[0.12em]">
              Virtual Try-On
            </div>
          </div>
        )}

        {showConsent && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-2xl bg-white text-black rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-black/5 p-6 sm:p-10">
              <button
                type="button"
                onClick={handleConsentDecline}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-black/60 hover:text-black focus:outline-none"
                aria-label="Decline consent"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-black mb-3">
                    Consent Form
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-black/80">
                    To enjoy the Marvella Virtual Try-On (VTO) experience, we
                    need access to your camera. By clicking{" "}
                    <span className="font-semibold">“I want to proceed”</span>,
                    you allow us to process live images of your face to preview
                    lipstick shades in augmented reality. To use this feature
                    you should be at least 18 years old. Your video feed stays
                    on your device, is processed in real time for shade
                    rendering, and is never stored or shared with third parties.
                    The imagery will not be reused for unrelated purposes.
                    Review our{" "}
                    <a
                      href="#privacy-policy"
                      className="underline decoration-black/50 underline-offset-4 hover:text-black"
                    >
                      Privacy Policy
                    </a>{" "}
                    for details about data use and your rights.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleConsentDecline}
                    className="px-5 py-2.5 rounded-full border border-black/25 text-black/70 hover:text-black hover:border-black transition-colors text-sm sm:text-base"
                  >
                    I decline
                  </button>
                  <button
                    type="button"
                    onClick={handleConsentAccept}
                    className="px-5 py-2.5 rounded-full bg-black text-white font-semibold hover:bg-black/85 transition-colors text-sm sm:text-base shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
                  >
                    I want to proceed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {consentDeclined && !showConsent && !consentAccepted && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-[28px] border border-white/15 bg-black/85 text-white p-6 sm:p-8 text-center space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <h3 className="text-xl sm:text-2xl font-semibold">
                Consent Required
              </h3>
              <p className="text-sm sm:text-base text-white/80">
                We need your permission to access the camera before launching
                the Virtual Try-On experience. You can review the consent
                details again or close this window to exit.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={reopenConsent}
                  className="px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:bg:white/90 transition-colors text-sm sm:text-base"
                >
                  Review consent
                </button>
              </div>
            </div>
          </div>
        )}

        {snapshot && (
          <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-4">
            <img
              src={snapshot}
              alt="Lipstick Try-On Snapshot"
              className="max-w-full max-h-[75%] rounded-lg shadow-2xl border-4 border-white"
            />
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setSnapshot(null)}
                className="px-5 py-2 sm:px-6 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <a
                href={snapshot}
                download="lipstick-try-on.png"
                className="px-5 py-2 sm:px-6 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {!started && consentAccepted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 p-4">
            <button
              onClick={startCamera}
              className="px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg bg-white text-black rounded-full font-semibold transform hover:scale-105 active:scale-100 transition-transform"
            >
              Start Virtual Try-On
            </button>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 z-20">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 sm:px-6 sm:py-4 rounded-xl text-center w-11/12 max-w-md">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}

        {/* Shade badge (single mode) */}
        {started && !snapshot && !compareEnabled && (
          <div
            aria-live="polite"
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-20 sm:top-24 z-20 transition-all duration-300 ease-out ${
              showShadeBadge
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/55 backdrop-blur-md shadow-lg border border-white/10 flex items-center gap-2.5">
              {activeShade.color !== "transparent" ? (
                <span
                  className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full ring-2 ring-white/30"
                  style={{ backgroundColor: activeShade.color }}
                  aria-hidden="true"
                />
              ) : (
                <span className="relative inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5">
                  <span className="absolute inset-0 rounded-full bg-neutral-500/70" />
                  <span className="absolute inset-0 rotate-45 w-[2px] bg-red-400 rounded" />
                </span>
              )}

              <div className="text-white text-sm sm:text-base font-semibold tracking-wide whitespace-nowrap max-w-[12rem] sm:max-w-[16rem] truncate">
                {formatShadeLine(activeShade)}
              </div>

              {activeShade.color !== "transparent" && (
                <div className="text-white/70 text-[10px] sm:text-xs font-mono">
                  {activeShade.color.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Split overlay: slider + dual tray */}
        {compareEnabled && started && !snapshot && (
          <>
            {/* Center drag handle */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              <div
                className="absolute inset-0"
                aria-hidden="true"
              >
                <div
                  className="absolute top-0 bottom-0 w-px"
                  style={{
                    left: `${compareRatio * 100}%`,
                    transform: "translateX(-0.5px)",
                  }}
                >
                  <div className="h-full w-px bg-gradient-to-b from-white/10 via-white/80 to-white/10 opacity-90" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="h-14 w-px bg-white/25 blur-[2px]" />
                  </div>
                </div>
              </div>

              <div
                className="pointer-events-none absolute top-1/2 flex h-12 w-12 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border border-white/60 bg-black/70 text-white shadow-[0_14px_30px_rgba(0,0,0,0.55)] backdrop-blur-md"
                style={{ left: `${compareRatio * 100}%` }}
                aria-hidden="true"
              >
                <span className="absolute inset-0 rounded-full border border-white/15 blur-sm" aria-hidden="true" />
                <span className="absolute inset-1 rounded-full border border-white/40" aria-hidden="true" />
                <svg
                  className="w-5 h-5 relative drop-shadow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3.5 13.8 9l5.7.4-4.5 3.1 1.5 5.5L12 14.6 7.5 18l1.5-5.5-4.5-3.1 5.7-.4Z" />
                </svg>
              </div>
            </div>

            {/* Floating shade labels near split */}
            {!comparePickerOpen && (
              <div className="pointer-events-none absolute inset-x-0 bottom-[25%] px-5 flex items-end justify-between text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/75 bg-black/35">
                    <span
                      className="h-9 w-9 rounded-full"
                      style={{
                      backgroundColor:
                        leftShade.color === "transparent"
                          ? "rgba(110,110,110,0.65)"
                          : leftShade.color,
                    }}
                  />
                  <span className="absolute inset-[3px] rounded-full border border-white/45" aria-hidden="true" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    Left
                  </span>
                  <span className="text-[15px] font-semibold">{leftShadeLine}</span>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSide("right");
                    setComparePickerOpen(true);
                  }}
                  className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/75 bg-black/40 text-white shadow-[0_12px_28px_rgba(0,0,0,0.55)] backdrop-blur"
                  aria-label={rightShade?.id === 0 ? "Add another shade" : "Switch right shade"}
                >
                  {rightShade?.id === 0 ? (
                    <span className="text-2xl leading-none">+</span>
                  ) : (
                    <>
                      <span
                        className="h-9 w-9 rounded-full"
                        style={{
                          backgroundColor:
                            rightShade?.color === "transparent"
                              ? "rgba(110,110,110,0.65)"
                              : rightShade?.color,
                        }}
                        aria-hidden="true"
                      />
                      <span className="absolute inset-[3px] rounded-full border border-white/45" aria-hidden="true" />
                    </>
                  )}
                </button>
                <div className="flex flex-col leading-tight text-right">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    {rightShade?.id === 0 ? "" : "Right"}
                  </span>
                  <span className="text-[15px] font-semibold">
                    {rightShade?.id === 0 ? "Add another" : rightShadeLine}
                  </span>
                </div>
              </div>
            )}

            <div
              className={`absolute inset-x-0 bottom-0 z-40 pointer-events-auto ${
                isMobileView && comparePickerOpen ? "" : "pointer-events-none invisible"
              }`}
              style={{
                paddingBottom:
                  "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
              }}
            >
              <div className="pointer-events-auto w-full px-3 pb-3 flex justify-center">
                <div className="relative w-full max-w-[540px] rounded-t-[30px] bg-[#0c0c0c]/92 border border-white/12 shadow-[0_-25px_60px_rgba(0,0,0,0.65)] px-4 pt-5 pb-5 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setComparePickerOpen(false)}
                    className="absolute left-4 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white"
                    aria-label="Back"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparePickerOpen(false)}
                    className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white"
                    aria-label="Close shade tray"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80 bg-black/35">
                        <span
                          className="h-9 w-9 rounded-full"
                          style={{
                            backgroundColor:
                              leftShade.color === "transparent"
                                ? "#6f6f6f"
                                : leftShade.color,
                          }}
                          aria-hidden="true"
                        />
                        <span className="absolute inset-[3px] rounded-full border border-white/45" aria-hidden="true" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-[10px] uppercase tracking-[0.32em] text-white/70">
                          Compare to
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {leftShadeLine}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/75 tracking-wide">
                        VS
                      </span>
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/70 bg-black/35">
                        {comparePreviewShade?.id === 0 ? (
                          <span className="h-[3px] w-4 rotate-45 bg-white/85 rounded-full" />
                        ) : (
                          <span
                            className="h-9 w-9 rounded-full"
                            style={{
                              backgroundColor:
                                comparePreviewShade?.color === "transparent"
                                  ? "#6f6f6f"
                                  : comparePreviewShade?.color,
                            }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="absolute inset-[3px] rounded-full border border-white/45" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollCompareRail(-1)}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white"
                      aria-label="Scroll shades left"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    <div
                      ref={compareScrollerRef}
                      className="hide-scrollbar flex-1 flex items-center gap-3 overflow-x-auto py-1 px-2"
                      style={{ touchAction: "pan-x" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setRightShade(LIPSTICK_SHADES[0]);
                          setComparePickerOpen(true);
                        }}
                        className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden transition-transform duration-150"
                        style={{
                          background: "rgba(110,110,110,0.45)",
                          boxShadow:
                            rightShade?.id === 0
                              ? "0 0 0 2.3px rgba(255,255,255,0.94), 0 0 0 5.5px rgba(0,0,0,0.45)"
                              : "0 0 0 1.5px rgba(255,255,255,0.26)",
                        }}
                        title="None"
                      >
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-[3px] w-4 rotate-45 bg-white/85 rounded-full" />
                        </span>
                      </button>
                      <div className="flex items-center gap-3">
                        {LIPSTICK_SHADES.filter((s) => s.id !== 0).map(
                          (shade) => {
                            const isSelected = rightShade?.id === shade.id;
                            const shadeColor =
                              shade.color === "transparent"
                                ? "rgba(110,110,110,0.65)"
                                : shade.color;
                            const shadeBackground =
                              shade.color === "transparent"
                                ? shadeColor
                                : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16), rgba(255,255,255,0) 55%), ${shadeColor}`;
                            return (
                              <button
                                key={shade.id}
                                type="button"
                                onClick={() => {
                                  setRightShade(shade);
                                  setComparePickerOpen(false);
                                }}
                                className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden transition-transform duration-150 hover:scale-105"
                                style={{
                                  background: shadeBackground,
                                  boxShadow: isSelected
                                    ? "0 0 0 2.3px rgba(255,255,255,0.94), 0 0 0 5.5px rgba(0,0,0,0.45)"
                                    : "0 0 0 1.5px rgba(255,255,255,0.26)",
                                }}
                                title={shade.name}
                              />
                            );
                          }
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollCompareRail(1)}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white"
                      aria-label="Scroll shades right"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-center text-[11px] uppercase tracking-[0.3em] text-white/80">
                    Select a shade to compare
                  </div>

                  <div className="text-center text-white leading-tight space-y-0.5">
                    <div className="text-[11px] font-medium text-white/70 tracking-[0.2em] uppercase">
                      {PRODUCT_LINE_LABEL}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom controls & single-shade rail */}
        {started && !snapshot && !compareEnabled && (
          <div
            className="absolute inset-x-0 bottom-0 pt-4 pb-7 bg-gradient-to-t from-black via-black/75 to-transparent z-10"
            style={{
              paddingBottom:
                "calc(env(safe-area-inset-bottom, 0px) + 6.5rem)",
            }}
          >
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 px-4">
              <div className="w-full max-w-xl flex flex-col items-center gap-3">
                <div className="w-full rounded-[24px] bg-black/85 border border-white/10 backdrop-blur-md shadow-[0_-14px_40px_rgba(0,0,0,0.55)] px-4 py-3">
                  <div className="text-center text-[11px] uppercase tracking-[0.26em] text-white/75">
                    Choose your shade
                  </div>
                  <div className="mt-2">
                    <div
                      ref={shadeScrollerRef}
                      className="hide-scrollbar flex items-center justify-center gap-3.5 overflow-x-auto scroll-smooth py-1.5"
                      style={{ touchAction: "pan-x" }}
                    >
                      {LIPSTICK_SHADES.map((shade) => {
                        const isSelected =
                          (activeSide === "left"
                            ? leftShade.id
                            : rightShade.id) === shade.id;
                        const shadeColor =
                          shade.color === "transparent"
                            ? "rgba(110,110,110,0.65)"
                            : shade.color;
                        const shadeBackground =
                          shade.color === "transparent"
                            ? shadeColor
                            : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), ${shadeColor}`;
                        return (
                          <button
                            key={shade.id}
                            type="button"
                            ref={(el) => {
                              if (el) {
                                shadeButtonsRef.current[shade.id] = el;
                              } else {
                                delete shadeButtonsRef.current[shade.id];
                              }
                            }}
                            onClick={() => {
                              if (activeSide === "left") setLeftShade(shade);
                              else setRightShade(shade);
                            }}
                            className={`relative flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden transition-transform duration-200 ease-out ${
                              isSelected ? "scale-105" : "hover:scale-105"
                            }`}
                            style={{
                              background: shadeBackground,
                              boxShadow: isSelected
                                ? "0 0 0 3px rgba(255,255,255,0.98), 0 0 0 7px rgba(0,0,0,0.45)"
                                : "0 0 0 1.5px rgba(255,255,255,0.26)",
                            }}
                            title={shade.name}
                          >
                            {shade.id === 0 && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="h-[3px] w-4 rotate-45 bg-white/85 rounded-full" />
                              </span>
                            )}
                            {isSelected && (
                              <span className="absolute inset-[5px] sm:inset-[6px] rounded-full border border-white/80 opacity-90" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-2 text-center text-white leading-tight">
                    <div className="text-[11px] sm:text-xs font-medium text-white/70 tracking-[0.16em] uppercase">
                      {PRODUCT_LINE_LABEL}
                    </div>
                    <div className="mt-0.5 text-base sm:text-lg font-semibold text-white">
                      {leftShadeLine}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="w-full max-w-lg flex items-center justify-center gap-6 text-white text-opacity-90">
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_10px_22px_rgba(0,0,0,0.55)] hover:border-white/45 transition-colors">
                  <svg
                    className="w-4 h-4 md:w-4.5 md:h-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </button>
                <button
                  onClick={toggleCompare}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors border ${
                    compareEnabled
                      ? "bg-white text-black shadow-[0_12px_26px_rgba(0,0,0,0.45)] border-black/25"
                      : "border-white/25 bg-black/55 text-white hover:border-white/45 shadow-[0_10px_22px_rgba(0,0,0,0.55)]"
                  }`}
                  aria-pressed={compareEnabled}
                  title={
                    compareEnabled
                      ? "Disable dual shades"
                      : "Dual shades split"
                  }
                >
                  <svg
                    className="w-4 h-4 md:w-4.5 md:h-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="12" r="5" />
                    <circle cx="15" cy="12" r="5" />
                  </svg>
                </button>
                <button
                  onClick={takeSnapshot}
                  className="relative flex h-[3.25rem] w-[3.25rem] md:h-[3.6rem] md:w-[3.6rem] items-center justify-center rounded-full bg-white/98 shadow-[0_18px_34px_rgba(0,0,0,0.45)] active:scale-95 transition-transform"
                >
                  <div className="h-[85%] w-[85%] rounded-full border-[4px] border-black/85"></div>
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_10px_22px_rgba(0,0,0,0.55)] hover:border-white/45 transition-colors">
                  <svg
                    className="w-4 h-4 md:w-4.5 md:h-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_10px_22px_rgba(0,0,0,0.55)] hover:border-white/45 transition-colors">
                  <svg
                    className="w-4 h-4 md:w-4.5 md:h-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

