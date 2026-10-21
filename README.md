# 3D Studiya

Brauzerda ishlaydigan 3D ko’rish, tahrirlash va konvertatsiya sayti. Server kerak emas.

## Tuzilma
- `index.html` — sahifa
- `css/style.css` — dizayn (yorug’ va qorong’i rejim)
- `js/core.js` — sahna, kamera, boshqaruv
- `js/dff-read.js`, `js/txd.js` — GTA DFF va TXD o’qish
- `js/dff-write.js` — DFF yozish (GTA SA)
- `js/loader.js` — fayl ochish va sudrab tashlash
- `js/edit.js` — Edit mode: nuqtalarni tanlash, siljitish, bekor qilish
- `js/yft.js` — GTA V YFT (fragment) geometriyasini o’qish
- `js/tools.js` — poligon kamaytirish, avto razmer, attach/detach, dummy, material presetlari, teksturalar
- `js/txd-write.js` — TXD yozish (DXT1/DXT3, mipmap, GTA SA)
- `js/ytd.js` — GTA V YTD teksturalarini o’qish (DXT1/3/5)
- `js/formats.js` — FBX, DAE, WRL, VTK, 3MF, USD/USDA/USDZ import va eksport
- `js/rpf.js` — GTA V RPF7 arxivini (shifrsiz “OPEN”) ochish, fayllarni yuklab olish
- `js/editor.js` — tanlash, ko’chirish, rang, nom
- `js/features.js` — Blender uslubidagi qo’shimchalar: primitivlar, nusxa, bekor qilish, raqamli joylashtirish, ko’rinishlar, render
- `js/export.js` — GLB, GLTF, OBJ, STL, PLY, DFF eksporti
- `vendor/` — Three.js (sayt internetsiz ham ishlaydi)
- `sw.js` — oflayn kesh (kodni o’zgartirsangiz `v1` ni `v2` ga almashtiring)

## Ishga tushirish
`python -m http.server 8000` va brauzerda `localhost:8000`. GitHub Pages yoki Vercel’ga shu papkani o’zini yuklash yetarli.
