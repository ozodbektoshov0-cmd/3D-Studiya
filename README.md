# 3D Studiya

Brauzerda ishlaydigan 3D ko’rish, tahrirlash va konvertatsiya dasturi (React + TypeScript + Vite + Three.js).

## Imkoniyatlar
- **Ko'p formatli import**: GLB, GLTF, OBJ, STL, PLY, FBX, DAE, WRL/VRML, VTK, 3MF, USD/USDA/USDZ, RenderWare DFF, TXD, GTA V YFT, YDR, YTD, RPF7 arxivlari va PNG/JPG/WEBP teksturalar.
- **Ko'p formatli eksport**: GLB, GLTF, OBJ, STL, PLY, DFF, FBX, DAE, WRL, VTK, 3MF, USDA, USD, USDZ hamda TXD (DXT1/DXT3, mipmap).
- **Tahrirlash vositalari**:
  - Ko'chirish (G), Aylantirish (R), O'lcham (S), Kamera fokus (F)
  - Vertex Edit mode (Tab) nuqtalarni tanlash va siljitish
  - Poligon kamaytirish (decimate)
  - Avto razmer (GTA avtomobillari va piyoda o'lchamlariga moslash, Z-o'qiga to'g'irlash, yerga qo'yish)
  - Mesh birlashtirish (Attach) va ajratish (Detach)
  - Markazni o'rnatish, ko'zgu (Mirror X), silliq/qirrali soya
  - Materiallar: Chrome, Yaltiroq bo'yoq, Oyna, Mat
  - Render (PNG) saqlash
  - RPF arxivlaridan to'g'ridan-to'g'ri model ochish va ichki fayllarni ko'rish

## Tuzilma
- `src/App.tsx` — asosiy interfeys komponenti
- `src/context/StudioContext.tsx` — 3D sahna, tanlov, transformatsiya va holat boshqaruvi
- `src/components/Header.tsx` — yuqori menyular (Fayl, Tahrir, Qo'shish, Obyekt, Material, Asboblar)
- `src/components/LeftToolbar.tsx` — chap asboblar paneli
- `src/components/Viewport.tsx` — 3D ko'rinish va boshqaruv tugmalari
- `src/components/Sidebar.tsx` — Outliner, Teksturalar va Xossalar paneli
- `src/components/RpfDialog.tsx` — GTA V RPF arxivi ko'rish oynasi
- `src/utils/` — DFF, TXD, YFT, YTD, RPF, FBX, DAE, 3MF, USD, VTK, WRL konvertorlari

## Ishga tushirish
```bash
npm install
npm run dev
```
Port: `3000` (host: `0.0.0.0`).
