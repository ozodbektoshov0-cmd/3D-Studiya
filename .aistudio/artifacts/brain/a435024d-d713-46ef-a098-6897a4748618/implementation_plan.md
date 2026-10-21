# 3D Studiya Visual Perfection & 4K Render Studio

Comprehensive visual and inspection enhancement for 3D Studiya featuring **realistic contact shadows**, **live 3D dimension ruler & bounding specs**, and an **Ultra HD (1x / 2K / 4K) Render Studio** with transparent background export.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers during Phase 1 clarification:
> - **Primary Focus**: Visual quality, dimension measuring ruler, and 4K render export.
> - **3D Viewport Additions**: Realistic soft contact shadows flush to the ground plane, plus an interactive 3D bounding dimension overlay showing exact Length, Width, and Height in meters.
> - **Render PNG Export**: Dedicated high-resolution export workflow supporting 1x (viewport), 2K (QHD), and 4K (Ultra HD), with optional transparent background export.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  1. **Ground Contact Shadow System**: Soft, physically grounded ambient occlusion contact shadow beneath models to eliminate floating object syndrome across all lighting presets.
  2. **Model Dimension Ruler & Spatial Metrics**: Real-time bounding dimension box (`X × Y × Z` in meters) with corner guides, volume calculation, and toggled display from the viewport header.
  3. **High-Resolution Render Studio**: Modal/drawer for export with 1x, 2K, and 4K supersampling, transparent PNG alpha channel toggle, and seamless download.
- **Target Audience**: 3D designers, modders, and digital artists requiring publication-ready renders and precise scale verification before exporting.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Realistic Grounding**: Loaded models immediately receive a soft contact shadow plane at the model's lowest contact point (`min.y`), automatically updated during transforms, scaling, and auto-sizing.
2. **Dimension Inspection**:
   - The Viewport header features an **O’lcham (M)** toggle.
   - When enabled, a subtle wireframe bounding cage encapsulates the selected mesh or whole model, displaying exact dimensions (e.g. `Uzunlik: 4.52 m · Kenglik: 1.84 m · Balandlik: 1.42 m`) in a clean HUD badge.
3. **High-Resolution Render Export**:
   - Clicking **Render (PNG)** in the Fayl menu opens the **Render Studiyasi** modal.
   - Users select their target resolution: **1x (Ekranga mos)**, **2K (2560×1440)**, or **4K (3840×2160)**.
   - Users can toggle **Shaffof fon (Transparent PNG)** to omit the background gradient for graphics editing.
   - Clicking **Saqlash** renders the scene at the target resolution with full anti-aliasing and downloads the crisp PNG file.

### Visual Architecture & Theme
- Strict alignment with the dark studio theme (`--bg: #1d1d1d`, `--pn: #303030`, `--ac: #4772b3`, `--or: #ffa028`).
- Clean modal design for Render Studio with subtle dark backdrop scrim.
- Zero clutter in the 3D viewport: all inspection badges remain lightweight and collapsible.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural Soft Contact Shadow vs. Heavy Dynamic Shadow Maps**
  - *Chosen Approach*: Procedural high-resolution radial contact shadow canvas texture with exponential falloff projected onto a ground plane, combined with soft directional key shadow.
  - *Why*: Ensures 60fps performance on all devices (including software WebGL) without shadow acne, pixelated edge artifacts, or high draw-call costs.
  - *Alternatives Considered*: Pure directional shadow mapping (causes jagged edges and requires heavy shadow frustum tuning).

- **Decision 2: Offscreen Supersampling for 2K/4K Renders**
  - *Chosen Approach*: Render to an offscreen canvas sized to 2560×1440 or 3840×2160 using the existing Three.js scene and camera projection matrix, then restore the canvas size.
  - *Why*: Delivers true 4K pixel density without resizing or flickering the user's active viewport window.

- **Decision 3: Dimension Box Representation**
  - *Chosen Approach*: Clean Three.js `LineSegments` bounding cage with an interactive floating DOM dimension card in the viewport corner.
  - *Why*: Text rendered via HTML DOM is crisp, readable at all screen resolutions, and does not distort when zooming or orbiting.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Header.tsx                          │
│   Fayl ──> [Render Studiyasi (PNG 1x/2K/4K)...]             │
└──────────────────────────────┬──────────────────────────────┘
                               │ opens modal
                               ▼
                 ┌─────────────────────────────┐
                 │    RenderModal.tsx          │
                 │  • 1x, 2K, 4K resolution    │
                 │  • Shaffof fon (Alpha PNG)  │
                 │  • Saqlash (Download)       │
                 └─────────────┬───────────────┘
                               │ triggers high-res render
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      StudioContext.tsx                      │
│                                                             │
│   • contactShadowPlane: THREE.Mesh (Radial falloff canvas)  │
│   • dimensionsVisible: boolean                              │
│   • dimensionBoxHelper: THREE.Box3Helper / LineSegments     │
│   • getModelDimensions(): { x, y, z, volume, center }       │
│   • renderHighResImage(resScale, transparent): Promise<Blob>│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Viewport.tsx                         │
│   • Viewport header: [O’lcham] toggle + [Soya] toggle       │
│   • Dimension metrics HUD badge (Width, Height, Length in m)│
│   • Ground contact shadow beneath model                     │
└─────────────────────────────────────────────────────────────┘
```

### High-Resolution Render Specifications

| Profile | Output Resolution | Antialiasing | Background Options |
| :--- | :--- | :--- | :--- |
| **1x (Standart)** | Current Viewport dimensions | Enabled (SMAA/FXAA) | Theme gradient or Transparent Alpha |
| **2K (QHD)** | `2560 × 1440` (16:9) | 2x Supersampled | Theme gradient or Transparent Alpha |
| **4K (Ultra HD)**| `3840 × 2160` (16:9) | 4x Supersampled | Theme gradient or Transparent Alpha |

### Step-by-Step Implementation Flow
1. **Extend `src/types.ts`**:
   - Add `ModelDimensions` interface (`width`, `height`, `length`, `volume`, `center`).
   - Add `RenderOptions` interface (`resolution: '1x' | '2k' | '4k'`, `transparent: boolean`).
2. **Contact Shadow Utility (`src/utils/shadows.ts`)**:
   - Generate procedural soft radial blur contact shadow canvas texture.
   - Create contact shadow plane positioned flush at model bottom (`min.y`).
3. **High-Res Render Engine (`src/utils/renderHighRes.ts`)**:
   - Support rendering scene to target canvas dimensions (`1x`, `2560×1440`, `3840×2160`) with transparent background support.
4. **Enhance `StudioContext.tsx`**:
   - Add contact shadow auto-alignment on model load/transform.
   - Add `dimensionsVisible` state and `getModelDimensions()` computation.
   - Add `renderHighRes(options)` handler.
5. **Create `RenderModal.tsx` (`src/components/RenderModal.tsx`)**:
   - Clean dark modal for render options (resolution choice, transparent toggle, download action).
6. **Update `Viewport.tsx` & `src/style.css`**:
   - Add `O’lcham` (Dimensions) and `Soya` (Shadow) buttons to `#vh`.
   - Add floating dimension metrics badge in viewport corner when enabled.
   - Add styling for modal and dimension badge.
7. **Verification**:
   - Compile via `compile_applet`, verify with `lint_applet`, and test dev server.
