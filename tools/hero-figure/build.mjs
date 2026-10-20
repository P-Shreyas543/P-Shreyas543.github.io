// Hero figure for projectifyzone.com: a prototype on the bench, coming apart.
//
// Built with the Anatomy kit (https://github.com/wheresryan22/anatomy, MIT), vendored in ./kit.
//
//   node tools/hero-figure/build.mjs           writes the figure into index.html (between the markers)
//   node tools/hero-figure/build.mjs --audit   also proves the geometry and exits non-zero on any fault
//
// Concept: the founder's idea is the sketch on paper beside the bench; the device on the mat is what it
// becomes. Hovering (or the legend buttons) takes the device apart the way it is really assembled: the four
// cover screws come out first, then the cover lifts off, then the circuit board lifts out of the tray.
// The legend groups the parts into what Projectify Zone builds: enclosure, custom PCB, firmware (the
// microcontroller module) and connectivity (the module's antenna).
//
// Parts (about 70 solids): cutting mat with grid, border and ruler strip; sketch sheet and pencil;
// tray floor, four walls, four screw bosses, four PCB standoffs, USB-C cut-out; PCB with four mounting
// screws, ESP32-style module (board, shield can, antenna area with meander trace), USB-C receptacle,
// CR2032 holder, coin and clip, 1x6 header with pins, sensor, crystal, regulator, LED, tact switch,
// eight passives, traces and vias; cover with screw counterbores, display window and live trace, vents,
// button cap and light pipe; four cover screws.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as A from "./kit/audit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");

// ---------- Motion: one spring per assembly, staggered (the live page uses the same numbers) ----------
const STAGGER = ["screws", "cover", "pcb"];          // opening order: outermost first
const SPRING = { stagger: 0.09, stiffness: 64, damping: 14.2, substeps: 4 };
const MOVES = { screws: [0, 0, 158], cover: [0, 0, 128], pcb: [0, 0, 44] };

// ---------- World plan (units ≈ mm) ----------
const MAT = { x: -118, y: -78, w: 236, d: 150, r: 6 };
const MAT_H = 3;
const GRID = { x: -111, y: -71, w: 222, d: 120, r: 2 };
const STRIP = { x: -107, y: 56, w: 214, d: 7, r: 1 };

const PAPER = { x: -106, y: -44, w: 66, d: 92, r: 1 };
const PAPER_H = 0.4;

const T = { x: -14, y: -52, w: 112, d: 76, r: 1 };   // tray outline
const WALL = 3;
const FLOOR_H = 2;
const RIM = 18;                                       // tray top
const COVER_H = 5;
const BOSS_R = 5;
const BOSS_IN = 8;                                    // boss centre inset from tray corner (tangent to inner walls)

const PCB = { x: T.x + 13, y: T.y + 13, w: 86, d: 50, r: 1.6 };
const STANDOFF_H = 5;
const PCB_Z = FLOOR_H + STANDOFF_H;
const PCB_H = 1.6;
const TOP = PCB_Z + PCB_H;                            // component seating plane

const azimuth = 40;
const WIDTH = 560;
const HEIGHT = 540;
const apartTop = RIM + COVER_H + 1.4 + MOVES.screws[2];
const P = k.fitProjection(
  [...k.boxCorners(MAT, -MAT_H, 0), ...k.boxCorners(T, 0, apartTop)],
  WIDTH,
  HEIGHT,
  { pad: 10, azimuth },
);
const V = A.cameraBasis(P).V;
const R = A.recorder(P, { order: STAGGER, spring: SPRING });

// ---------- Helpers ----------
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dots = (pts, style) => k.dotsSvg(pts.map(at), style);
const mid = (plan, z) => [plan.x + plan.w / 2, plan.y + plan.d / 2, z];
const xy = (plan) => ({ x: plan.x, y: plan.y, w: plan.w, d: plan.d, r: plan.r ?? 0.6 });
const path = (pts) => "M" + pts.map((p) => at(p).map((v) => v.toFixed(1)).join(" ")).join("L") + "Z";

// Puts one drawn part into the depth-sorted list with its true shape for the audit.
function part({ name, piece, ride = "base", centre, svg, shapes, bias = 0 }) {
  R.put({ name, piece, ride, move: MOVES[ride] ?? [0, 0, 0], at: centre, bias, svg, shapes: shapes.map((s) => R.solid(s)) });
}
const slabShape = (plan, z, h, name, meta = {}) => A.slab(xy(plan), z, h, { name, ...meta });
const cylShape = (cx, cy, r, z, h, name, meta = {}) => A.cylinder(cx, cy, r, z, h, { name, ...meta });

// The waveform the founder sketched is the one the finished device shows on its screen.
const WAVE = [0, -3, 2, -5, 4, -2, 3, -4, 0];

// ================= Base: mat, sketch, pencil (static) =================
{
  const grid = [];
  for (let x = GRID.x + 18.5; x < GRID.x + GRID.w - 1; x += 18.5) grid.push(k.lineOnTop([x, GRID.y], [x, GRID.y + GRID.d], 0, P));
  for (let y = GRID.y + 15; y < GRID.y + GRID.d - 1; y += 15) grid.push(k.lineOnTop([GRID.x, y], [GRID.x + GRID.w, y], 0, P));
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 0.6, 0.3, [2, 3.6], P);
  const svg = [
    `<path class="iso-halo" d="${k.haloOf(MAT, -MAT_H, MAT_H, P)}"/>`,
    S(k.slabOf(MAT, -MAT_H, MAT_H, P, 8, 1.2), { tone: "lo" }),
    L(k.planOutline(GRID, 0, P, 3), { tone: "lo" }),
    L(grid.join(""), { tone: "faint" }),
    S(k.slabOf(STRIP, 0, 0.3, P, 3), { tone: "lo", crease: "none" }),
    L(ticks.minor, { tone: "lo" }),
    L(ticks.major, { tone: "mid" }),
  ].join("");
  part({ name: "stand.mat", piece: "base", centre: [0, 0, -MAT_H], bias: -50, svg, shapes: [slabShape(MAT, -MAT_H, MAT_H, "stand.mat", { ground: true })] });
}

{
  // The founder's sketch: the device as a rounded box, its button and screen, and three lines of notes.
  const s = k.insetPlan(PAPER, 10);
  const box = { x: s.x, y: s.y + 4, w: s.w, d: 34, r: 4 };
  const scr = { x: box.x + 6, y: box.y + 7, w: 26, d: 14, r: 1.5 };
  const notes = [0, 1, 2].map((i) => k.lineOnTop([s.x, box.y + box.d + 10 + i * 6], [s.x + [40, 28, 35][i], box.y + box.d + 10 + i * 6], PAPER_H, P));
  const wave = k.onTop(WAVE.map((v, i) => [scr.x + (i * scr.w) / (WAVE.length - 1), scr.y + scr.d / 2 + v]), PAPER_H, P);
  const svg = [
    S(k.slabOf(PAPER, 0, PAPER_H, P, 2), { tone: "hi", crease: "none" }),
    L(k.planOutline(box, PAPER_H, P, 4), { tone: "mid" }),
    L(k.planOutline(scr, PAPER_H, P, 3), { tone: "lo" }),
    L(k.ring(box.x + box.w - 8, box.y + box.d - 9, 3.5, PAPER_H, P, 20), { tone: "lo" }),
    L(wave, { tone: "blue", free: true }),
    L(notes.join(""), { tone: "lo", free: true }),
  ].join("");
  part({ name: "paper", piece: "base", centre: mid(PAPER, 0), svg, shapes: [slabShape(PAPER, 0, PAPER_H, "paper")] });
}

{
  // Pencil lying across the sketch, tip toward the device.
  const r = 3.2;
  const dir = G.unit3([Math.cos(-0.42), Math.sin(-0.42), 0]);
  const o = [-100, 36, PAPER_H + r];
  const F = G.frameAlong(o, dir);
  const segs = [
    { name: "pencil.eraser", prof: [[0, 2.9], [5, 3.0]], tone: "lo" },
    { name: "pencil.ferrule", prof: [[5, 3.35], [11, 3.35]], tone: "mid" },
    { name: "pencil.body", prof: [[11, r], [62, r]], tone: "hi" },
    { name: "pencil.wood", prof: [[62, r], [70, 0.9]], tone: "mid" },
    { name: "pencil.lead", prof: [[70, 0.9], [72.2, 0.2]], tone: "lo" },
  ];
  for (const s of segs) {
    const paths = G.solidOf(s.prof, F, P, {});
    const c = G.pointOf(F, (s.prof[0][0] + s.prof[s.prof.length - 1][0]) / 2, 0, 0);
    part({ name: s.name, piece: "base", centre: c, svg: S(paths, { tone: s.tone }), shapes: [A.solid(F, s.prof, { name: s.name })] });
  }
}

// ================= Tray (static) =================
{
  const svg = S(k.slabOf(T, 0, FLOOR_H, P, 3, 0.4), { tone: "mid" }) + L(k.planOutline(k.insetPlan(T, WALL), FLOOR_H, P, 3), { tone: "faint" });
  part({ name: "tray.floor", piece: "enclosure", centre: mid(T, 0), svg, shapes: [slabShape(T, 0, FLOOR_H, "tray.floor", { owner: "tray" })] });

  const walls = [
    { name: "tray.wall.back", plan: { x: T.x, y: T.y, w: T.w, d: WALL } },
    { name: "tray.wall.front", plan: { x: T.x, y: T.y + T.d - WALL, w: T.w, d: WALL } },
    { name: "tray.wall.left", plan: { x: T.x, y: T.y + WALL, w: WALL, d: T.d - 2 * WALL } },
    { name: "tray.wall.right", plan: { x: T.x + T.w - WALL, y: T.y + WALL, w: WALL, d: T.d - 2 * WALL } },
  ];
  for (const w of walls) {
    const plan = { ...w.plan, r: 0.4 };
    let inner = "";
    if (w.name === "tray.wall.right") {
      // USB-C cut-out on the outer face, lined up with the receptacle on the board.
      const yc = PCB.y + 36.5, zc = TOP + 1.6, hw = 5.2, hh = 2.2, x = T.x + T.w;
      const pts = [];
      for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI; pts.push([x, yc + hw - hh + Math.cos(a) * hh, zc + Math.sin(a) * hh]); }
      for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI; pts.push([x, yc - hw + hh + Math.cos(a) * hh, zc + Math.sin(a) * hh]); }
      inner = `<path class="pz-hole" d="${path(pts)}"/>` + L(path(pts), { tone: "lo" });
    }
    const svg = S(k.slabOf(plan, FLOOR_H, RIM - FLOOR_H, P, 2, 0.3), { tone: "mid", inner });
    part({ name: w.name, piece: "enclosure", centre: mid(plan, FLOOR_H), svg, shapes: [slabShape(plan, FLOOR_H, RIM - FLOOR_H, w.name, { owner: "tray" })] });
  }

  for (const [cx, cy] of k.corners(T, BOSS_IN)) {
    const svg = S(k.cylinder(cx, cy, BOSS_R, FLOOR_H, RIM - FLOOR_H, P, 28, 0.3), { tone: "mid" }) + L(k.ring(cx, cy, 1.6, RIM, P, 16), { tone: "lo" });
    part({ name: "tray.boss", piece: "enclosure", centre: [cx, cy, FLOOR_H], svg, shapes: [cylShape(cx, cy, BOSS_R, FLOOR_H, RIM - FLOOR_H, "tray.boss", { owner: "tray" })] });
  }
  for (const [cx, cy] of k.corners(PCB, 4)) {
    const svg = S(k.cylinder(cx, cy, 2.6, FLOOR_H, STANDOFF_H, P, 20), { tone: "mid" });
    part({ name: "tray.standoff", piece: "enclosure", centre: [cx, cy, FLOOR_H], svg, shapes: [cylShape(cx, cy, 2.6, FLOOR_H, STANDOFF_H, "tray.standoff", { owner: "tray" })] });
  }
}

// ================= PCB assembly (rides "pcb") =================
const px = PCB.x, py = PCB.y;
const MOD = { x: px + 48, y: py + 5, w: 32, d: 18, r: 0.6 };      // module board
const SHIELD = { x: MOD.x + 1.2, y: MOD.y + 1.2, w: 21, d: 15.6, r: 0.8 };
const ANT = { x: MOD.x + 23.5, y: MOD.y, w: MOD.w - 23.5, d: MOD.d, r: 0.6 };
const USB = { x: px + 80, y: py + 32, w: 7.5, d: 9, r: 1 };
const COIN = [px + 20, py + 31];
const HEADER = { x: px + 7.8, y: py + 2.6, w: 16, d: 2.6, r: 0.3 };
const SENSOR = { x: px + 36, y: py + 33, w: 4, d: 4, r: 0.3 };
const XTAL = { x: px + 40.5, y: py + 9.5, w: 3.2, d: 2.5, r: 0.4 };
const REG = { x: px + 29, y: py + 9, w: 6.5, d: 3.5, r: 0.3 };
const LED = { x: px + 60, y: py + 41, w: 1.6, d: 0.9, r: 0.2 };
const BTN = { x: px + 66, y: py + 35, w: 6, d: 6, r: 0.4 };
const PASSIVES = [
  [px + 44, py + 25], [px + 47, py + 25], [px + 44, py + 28], [px + 47, py + 28],
  [px + 30.2, py + 15], [px + 33.4, py + 15], [px + 56, py + 41.1], [px + 42, py + 34.6],
];
const VIAS = [[px + 46, py + 31], [px + 54, py + 31], [px + 26, py + 22], [px + 62, py + 30]];

{
  const z = TOP;
  const trace = (pts) => k.onTop(pts, z, P);
  const traces = [
    trace([[SHIELD.x, py + 12], [px + 40, py + 12], [XTAL.x + XTAL.w, py + 10.75]]),            // module → crystal
    trace([[REG.x + REG.w, py + 11], [px + 38, py + 11], [px + 38, py + 8], [MOD.x, py + 8]]),   // regulator → module power
    trace([[SHIELD.x + 4, MOD.y + MOD.d], [SHIELD.x + 4, py + 27], [px + 46, py + 31]]),         // module → via
    trace([[px + 46, py + 31], [px + 41, py + 36], [SENSOR.x + SENSOR.w, py + 36]]),              // via → sensor
    trace([[SHIELD.x + 10, MOD.y + MOD.d], [SHIELD.x + 10, py + 29], [px + 54, py + 31]]),       // module → via
    trace([[px + 54, py + 31], [px + 54, py + 39], [px + 56, py + 41.5], [LED.x, py + 41.5]]),   // via → LED
    trace([[MOD.x + 20, MOD.y + MOD.d], [MOD.x + 20, py + 28], [px + 62, py + 30]]),              // module → via
    trace([[px + 62, py + 30], [px + 66, py + 34], [px + 68, BTN.y]]),                            // via → button
    trace([[USB.x, py + 34], [px + 74, py + 34], [px + 70, py + 30], [px + 70, MOD.y + MOD.d]]), // USB → module
    trace([[COIN[0] + 10.6, py + 27], [px + 26, py + 27], [px + 26, py + 22]]),                   // coin cell → via
    trace([[px + 26, py + 22], [px + 26, py + 15], [px + 30.2, py + 15]]),                        // via → passive
    trace([[HEADER.x + 1.5, HEADER.y + HEADER.d], [HEADER.x + 1.5, py + 9], [REG.x, py + 9]]),     // header → regulator
  ];
  const holes = k.corners(PCB, 4);
  const svg = [
    S(k.slabOf(PCB, PCB_Z, PCB_H, P, 3, 0.3), { tone: "hi", crease: "lo" }),
    L(traces.join(""), { tone: "blue" }),
    L(VIAS.map(([x, y]) => k.ring(x, y, 0.9, z, P, 12)).join(""), { tone: "red" }),
    L(holes.map(([x, y]) => k.ring(x, y, 2.4, z, P, 16)).join(""), { tone: "lo" }),
    L(k.planOutline(k.insetPlan(PCB, 1.4), z, P, 3), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([px + 8, py + 46], z, P, "x"), "PZ-01", { size: 2.6, tone: "lo" }),
  ].join("");
  part({ name: "pcb.board", piece: "pcb", ride: "pcb", centre: mid(PCB, PCB_Z), svg, shapes: [slabShape(PCB, PCB_Z, PCB_H, "pcb.board", { owner: "pcb" })] });

  for (const [x, y] of holes) {
    const svg = S(k.cylinder(x, y, 1.9, TOP, 0.8, P, 16, 0.2), { tone: "mid" }) + L(k.lineOnTop([x - 1.2, y], [x + 1.2, y], TOP + 0.8, P), { tone: "lo" });
    part({ name: "pcb.screw", piece: "pcb", ride: "pcb", centre: [x, y, TOP], svg, shapes: [cylShape(x, y, 1.9, TOP, 0.8, "pcb.screw", { owner: "pcb" })] });
  }
}

const comp = (name, piece, plan, h, style, extra = "", bevel = 0.2) =>
  part({ name, piece, ride: "pcb", centre: mid(plan, TOP), svg: S(k.slabOf(xy(plan), TOP, h, P, 2, bevel), style) + extra, shapes: [slabShape(plan, TOP, h, name, { owner: "pcb" })] });

// Module: board, shield can (firmware) and antenna area (connectivity)
comp("module.board", "firmware", { ...MOD, w: ANT.x - MOD.x }, 0.8, { tone: "mid" }, Dots([0, 1, 2, 3, 4, 5].map((i) => [MOD.x + 2 + i * 3.6, MOD.y + MOD.d - 0.7, TOP + 0.8]), { size: 0.4, tone: "mid" }));
{
  const zt = TOP + 0.8;
  const meander = k.onTop([[ANT.x + 1.5, ANT.y + 3], [ANT.x + ANT.w - 1.5, ANT.y + 3], [ANT.x + ANT.w - 1.5, ANT.y + 6], [ANT.x + 1.5, ANT.y + 6], [ANT.x + 1.5, ANT.y + 9], [ANT.x + ANT.w - 1.5, ANT.y + 9], [ANT.x + ANT.w - 1.5, ANT.y + 12], [ANT.x + 1.5, ANT.y + 12], [ANT.x + 1.5, ANT.y + 15]], zt, P);
  const feed = [ANT.x + 1.5, ANT.y + 15];
  part({
    name: "module.antenna", piece: "connectivity", ride: "pcb", centre: mid(ANT, TOP),
    svg: S(k.slabOf(xy(ANT), TOP, 0.8, P, 2, 0.2), { tone: "mid" }) + L(meander, { tone: "blue" }) + L(k.ring(feed[0], feed[1], 0.7, zt, P, 10), { tone: "red" }) + L(k.lineOnTop([ANT.x, ANT.y], [ANT.x, ANT.y + ANT.d], zt, P), { tone: "faint" }),
    shapes: [slabShape(ANT, TOP, 0.8, "module.antenna", { owner: "pcb" })],
  });
}
part({
  name: "module.shield", piece: "firmware", ride: "pcb", centre: mid(SHIELD, TOP + 0.8),
  svg: S(k.slabOf(xy(SHIELD), TOP + 0.8, 2.6, P, 2, 0.5), { tone: "hi", crease: "lo" }) + L(k.planOutline(k.insetPlan(SHIELD, 2), TOP + 3.4, P, 2), { tone: "faint" }) + Dots([[SHIELD.x + 2.4, SHIELD.y + 2.4, TOP + 3.4]], { size: 0.5, tone: "mid" }),
  shapes: [slabShape(SHIELD, TOP + 0.8, 2.6, "module.shield", { owner: "pcb" })],
});

comp("pcb.usb", "pcb", USB, 3.2, { tone: "mid" }, L(k.planOutline(k.insetPlan(USB, 1), TOP + 3.2, P, 2), { tone: "faint" }), 0.3);
comp("pcb.header", "pcb", HEADER, 2.5, { tone: "lo" });
for (let i = 0; i < 6; i++) {
  const x = HEADER.x + 1.5 + i * 2.6, y = HEADER.y + HEADER.d / 2;
  part({ name: "pcb.pin", piece: "pcb", ride: "pcb", centre: [x, y, TOP + 2.5], svg: S(k.cylinder(x, y, 0.35, TOP + 2.5, 3.5, P, 8), { tone: "mid", crease: "none" }), shapes: [cylShape(x, y, 0.35, TOP + 2.5, 3.5, "pcb.pin", { owner: "pcb" })] });
}
comp("pcb.sensor", "pcb", SENSOR, 0.9, { tone: "mid" }, Dots([[SENSOR.x + 0.8, SENSOR.y + 0.8, TOP + 0.9]], { size: 0.35, tone: "hi" }));
comp("pcb.crystal", "pcb", XTAL, 0.8, { tone: "mid" });
comp("pcb.regulator", "pcb", REG, 1.6, { tone: "mid" });
comp("pcb.led", "pcb", LED, 0.6, { tone: "mid", className: "pz-led" }, "", 0);
PASSIVES.forEach(([x, y], i) => comp("pcb.passive", "pcb", { x, y, w: 1.8, d: 0.9, r: 0.15 }, 0.5, { tone: i % 2 ? "lo" : "mid" }, "", 0));
{
  part({ name: "pcb.button", piece: "pcb", ride: "pcb", centre: mid(BTN, TOP), svg: S(k.slabOf(xy(BTN), TOP, 3.4, P, 2, 0.3), { tone: "mid" }), shapes: [slabShape(BTN, TOP, 3.4, "pcb.button", { owner: "pcb" })] });
  const [cx, cy] = [BTN.x + 3, BTN.y + 3];
  part({ name: "pcb.button.plunger", piece: "pcb", ride: "pcb", centre: [cx, cy, TOP + 3.4], svg: S(k.cylinder(cx, cy, 1.7, TOP + 3.4, 1, P, 16), { tone: "hi" }), shapes: [cylShape(cx, cy, 1.7, TOP + 3.4, 1, "pcb.button.plunger", { owner: "pcb" })] });
}
{
  const [cx, cy] = COIN;
  part({ name: "pcb.coin.holder", piece: "pcb", ride: "pcb", centre: [cx, cy, TOP], svg: S(k.cylinder(cx, cy, 10.6, TOP, 1.2, P, 48, 0.3), { tone: "lo" }), shapes: [cylShape(cx, cy, 10.6, TOP, 1.2, "pcb.coin.holder", { owner: "pcb" })] });
  part({
    name: "pcb.coin", piece: "pcb", ride: "pcb", centre: [cx, cy, TOP + 1.2],
    svg: S(k.cylinder(cx, cy, 10, TOP + 1.2, 3.2, P, 56, 0.6), { tone: "hi", crease: "lo" }) + L(k.ring(cx, cy, 7.5, TOP + 4.4, P, 40), { tone: "faint" }),
    shapes: [cylShape(cx, cy, 10, TOP + 1.2, 3.2, "pcb.coin", { owner: "pcb" })],
  });
  const clip = { x: cx - 2.4, y: cy - 10.4, w: 4.8, d: 9, r: 0.6 };
  part({ name: "pcb.coin.clip", piece: "pcb", ride: "pcb", centre: mid(clip, TOP + 4.4), svg: S(k.slabOf(clip, TOP + 4.4, 0.5, P, 2), { tone: "mid" }), shapes: [slabShape(clip, TOP + 4.4, 0.5, "pcb.coin.clip", { owner: "pcb" })] });
}

// ================= Cover (rides "cover") =================
const WINDOW = { x: T.x + 16, y: T.y + 14, w: 50, d: 30, r: 1.6 };
const VENTS = [0, 1, 2, 3, 4].map((i) => ({ x: T.x + 78 + i * 5, y: T.y + 16, w: 2, d: 26, r: 1 }));
const ZC = RIM + COVER_H;
{
  const screen = k.insetPlan(WINDOW, 2.5);
  const trace = k.onTop(WAVE.map((v, i) => [screen.x + (i * screen.w) / (WAVE.length - 1), screen.y + screen.d / 2 + v * 1.6]), ZC, P);
  const svg = [
    S(k.slabOf(T, RIM, COVER_H, P, 3, 1.1), { tone: "mid", inner: L(k.sideSeam(T, RIM + 1.4, P, 3), { tone: "faint" }) }),
    L(k.corners(T, BOSS_IN).map(([x, y]) => k.ring(x, y, 3, ZC, P, 20) + k.ring(x, y, 1.6, ZC, P, 14)).join(""), { tone: "lo" }),
    `<path class="pz-glass" d="${k.planOutline(WINDOW, ZC, P, 3)}"/>`,
    L(k.planOutline(WINDOW, ZC, P, 3), { tone: "lo" }),
    L(k.planOutline(screen, ZC, P, 2), { tone: "faint" }),
    L(trace, { tone: "blue" }),
    L(VENTS.map((v) => k.planOutline(v, ZC, P, 3)).join(""), { tone: "lo" }),
  ].join("");
  // The cover's real screw holes are part of its shape, so a screw shank in its hole is not a collision.
  const holes = k.corners(T, BOSS_IN).map(([x, y]) => A.cylinder(x, y, 1.25, RIM - 1, COVER_H + 2, { name: "cover.hole" }));
  part({ name: "cover", piece: "enclosure", ride: "cover", centre: mid(T, RIM), svg, shapes: [slabShape(T, RIM, COVER_H, "cover", { owner: "cover", cut: holes })] });

  const [bx, by] = [BTN.x + 3, BTN.y + 3];
  part({ name: "cover.button", piece: "enclosure", ride: "cover", centre: [bx, by, ZC], svg: S(k.cylinder(bx, by, 2.8, ZC, 1.2, P, 20, 0.3), { tone: "hi" }), shapes: [cylShape(bx, by, 2.8, ZC, 1.2, "cover.button", { owner: "cover" })] });
  const [lx, ly] = [LED.x + 0.8, LED.y + 0.45];
  part({ name: "cover.lightpipe", piece: "enclosure", ride: "cover", centre: [lx, ly, ZC], svg: S(k.cylinder(lx, ly, 1.4, ZC, 0.6, P, 14), { tone: "mid", className: "pz-led" }), shapes: [cylShape(lx, ly, 1.4, ZC, 0.6, "cover.lightpipe", { owner: "cover" })] });
}

// ================= Cover screws (ride "screws") =================
// Shank and head are separate items: the shank sits inside the cover's hole (behind its top face) at rest
// and in front of it once lifted, while the head is always above the cover.
// While a screw is part-way out, its shank is partly inside the cover's hole. Like the kit's rod-out-of-a-gland
// recipe, the shank is clipped to the space above the cover's top face; the clip (class pz-hold) belongs to the
// cover, so the live script keeps it at the cover's offset while the screw moves.
k.corners(T, BOSS_IN).forEach(([x, y], index) => {
  const SH = COVER_H - 0.4; // the thread stops just under the cover's top face, inside a hole it fills
  const above = G.hullOf([...k.circleRing(x, y, 1.6, 24).map(([cx, cy]) => at([cx, cy, ZC])), ...k.circleRing(x, y, 1.6, 24).map(([cx, cy]) => at([cx, cy, ZC + 400]))]);
  const id = `pz-clip-${index}`;
  const svg = `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path class="pz-hold" d="M${above.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}Z"/></clipPath>` +
    `<g clip-path="url(#${id})">${S(k.cylinder(x, y, 1.25, RIM, SH, P, 14), { tone: "mid", crease: "none" })}</g>`;
  part({ name: "screw.shank", piece: "enclosure", ride: "screws", centre: [x, y, RIM], svg, shapes: [cylShape(x, y, 1.25, RIM, SH, "screw.shank")] });
  const head = S(k.cylinder(x, y, 2.6, ZC, 1.4, P, 20, 0.3), { tone: "mid" }) + L(k.lineOnTop([x - 1.5, y], [x + 1.5, y], ZC + 1.4, P) + k.lineOnTop([x, y - 1.5], [x, y + 1.5], ZC + 1.4, P), { tone: "lo" });
  part({ name: "screw.head", piece: "enclosure", ride: "screws", centre: [x, y, ZC], svg: head, shapes: [cylShape(x, y, 2.6, ZC, 1.4, "screw.head")] });
});

// ---------- Settle depth order from the real geometry, then audit ----------
// The clipped shank is always drawn after the cover (the clip hides the part inside the hole), so that one
// pair is left out of the measured ordering and excused in the audit; every other pair is measured.
const SHANK_COVER = (a, b) => [a.name, b.name].some((n) => n.startsWith("screw.shank")) && [a.name, b.name].includes("cover");
A.settle(R, P, { skip: (a, b) => A.sameRun(a, b) || SHANK_COVER(a, b) });
const coverKey = R.items.find((it) => it.name === "cover").key;
for (const it of R.items) if (it.name.startsWith("screw.shank")) it.key = Math.max(it.key, coverKey + 0.05);
R.items.sort((a, b) => a.key - b.key);
A.auditOrExit(R, P, { allow: [["screw.shank*", "cover"]] });

// ---------- Emit ----------
const screenOf = (m) => { const a = at(m), o = at([0, 0, 0]); return [a[0] - o[0], a[1] - o[1]]; };
const SHARE = 1; // the static markup shows the figure apart; the live script takes it from there
const order = [...R.items].sort((a, b) => (a.key + G.dot3(a.move, V) * (STAGGER.includes(a.ride) ? SHARE : 0)) - (b.key + G.dot3(b.move, V) * (STAGGER.includes(b.ride) ? SHARE : 0)));
const items = order.map((it) => {
  const moving = STAGGER.includes(it.ride);
  const [mx, my] = screenOf(it.move);
  const lift = G.dot3(it.move, V);
  const attrs = [`class="it"`, `data-piece="${it.piece}"`, `data-k="${it.key.toFixed(4)}"`];
  if (moving) attrs.push(`data-ride="${it.ride}"`, `data-l="${lift.toFixed(4)}"`, `data-mx="${mx.toFixed(2)}"`, `data-my="${my.toFixed(2)}"`, `transform="translate(${(mx * SHARE).toFixed(1)} ${(my * SHARE).toFixed(1)})"`);
  let inner = it.svg;
  if (it.name.startsWith("screw.shank")) {
    const [cx, cy] = screenOf(MOVES.cover), [sx, sy] = screenOf(MOVES.screws);
    inner = inner.replace('class="pz-hold"', `class="pz-hold" transform="translate(${((cx - sx) * SHARE).toFixed(1)} ${((cy - sy) * SHARE).toFixed(1)})"`);
  }
  return `<g ${attrs.join(" ")}>${inner}</g>`;
});

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A prototype on an engineer's cutting mat, taken apart, beside the founder's pencil sketch of it. The four cover screws are lifted out, the cover with its display window is raised, and the circuit board is lifted from the enclosure tray. The board carries a wireless microcontroller module with its antenna, a coin-cell battery, a USB-C connector, a sensor, a button and an LED, joined by cyan traces.",
  body: items,
});

const START = "<!-- hero-figure:start -->";
const END = "<!-- hero-figure:end -->";
const indexPath = join(SITE, "index.html");
const html = readFileSync(indexPath, "utf8");
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) throw new Error("hero-figure markers not found in index.html");
const out = html.slice(0, a + START.length) + "\n" + svg.replace(/^<svg /, `<svg id="pz-figure" data-order="${STAGGER.join(" ")}" data-spring="${SPRING.stagger} ${SPRING.stiffness} ${SPRING.damping} ${SPRING.substeps}" `) + "\n" + html.slice(b);
writeFileSync(indexPath, out);
console.log(`hero figure: ${R.items.length} items, ${R.solids.length} solids, ${svg.length} bytes`);
