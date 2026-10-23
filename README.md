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
- `js/formats2.js` — STEP/IGES/BREP (OpenCascade), 3DM (rhino3dm), 3DS, AMF, LWO, PCD, XYZ, PTX, VOX, PMD/PMX, OFF, X3D, X, VTP
- `js/rpf.js` — GTA V RPF7 arxivini (shifrsiz “OPEN”) ochish, fayllarni yuklab olish
- `js/editor.js` — tanlash, ko’chirish, rang, nom
- `js/features.js` — Blender uslubidagi qo’shimchalar: primitivlar, nusxa, bekor qilish, raqamli joylashtirish, ko’rinishlar, render
- `js/export.js` — GLB, GLTF, OBJ, STL, PLY, DFF eksporti
- `vendor/` — Three.js (sayt internetsiz ham ishlaydi)
- `sw.js` — oflayn kesh: kod va HTML tarmoqdan olinadi (yangilanadi), `vendor/` keshdan. Versiya nomi `v21`

## Ishga tushirish
`python -m http.server 8000` va brauzerda `localhost:8000`. GitHub Pages yoki Vercel’ga shu papkani o’zini yuklash yetarli.

## SKP qo’llab-quvvatlash (SketchUp)
- `js/skp.js` — `.skp` import va eksport ([OpenSKP](https://github.com/iamahsanmehmood/openskp), MIT). Kutubxona avval `vendor/openskp.min.js` dan, bo’lmasa CDN’dan (jsDelivr, internet kerak) yuklanadi.
- **Import:** SketchUp 2013–2025. Yuklanganda GLB orqali sahnaga qo’shiladi.
- **Eksport:** Format ro’yxatidan `skp` tanlang. SketchUp 2013–2020 formatida yoziladi (yangi SketchUp ham ochadi). 1 birlik = 1 metr, Y-up → dyuym, Z-up. Uchburchaklar yuza bo’ladi, ranglar saqlanadi, teksturalar saqlanmaydi. Chegara: 250 000 uchburchak.
- Ixtiyoriy (CDN’siz ishlatish): Node.js 18+ bilan `sh tools/build-openskp.sh` → `vendor/openskp.min.js`. `vendor/license.openskp.txt` (MIT) ni qoldiring.
- Cheklov: katta fayllar (≈100 MB+) brauzer xotirasiga sig’maydi; juda eski (V3–V6) fayllar o’qilmasligi mumkin.

## Mesh asboblari (`js/mesh.js`)
- **Tuzilma:** ota/bola (Parent/Unparent), Boolean birlashtirish / ayirish / kesishma (BSP-CSG, 6000 uchburchakgacha, yopiq meshlar uchun).
- **Yuza:** yuza rejimi (tekis yuzani bosib tanlash), Extrude, Inset, o’chirish, Subdivide; UV avto (quti) va UV ×2, ÷2, 90°, aks.
- **Skelet:** skelet ko’rsatish, suyakni tanlab burish (poza), klip tanlash, tezlik.
- Hali yo’q: Bevel, keyframe yozish, vazn (skin weight) bo’yash.

## v21 qo’shimchalari
- DFF eksport: 65535 dan ko’p uchli meshlar avtomatik birlashtiriladi va qismlarga bo’linadi; materiallar birlashtiriladi, ishlatilmagani yozilmaydi; frame nomlari noyob; vertex ranglar (prelit).
- Boshqa formatdan importda tekstura nomi saqlanadi (rasm topilmasa ham) va DFF/TXD ga o’tadi.
- SKP import va eksport (OpenSKP).
- `.max` import (`js/maxread.js`): Editable Mesh/Poly, joylashuv/aylanish/o’lcham, pivot, ota-bola, instance, UV, smoothing group, Multi/Sub material (nom, rang, tekstura nomi). Parametrik obyektlar (Box, Sphere…) va modifikatorlar o’qilmaydi.

## v18 qo’shimchalari
- Chamfer (yuza), Klip menyusi (keyframe yozish → GLB/GLTF eksportga qo’shiladi).
- Kam ishlatiladigan yuklagichlar (FBX, DAE, WRL, 3MF, 3DS, LWO, MMD...) kerak bo’lganda yuklanadi — boshlang’ich yuklanish ≈0.8 MB kamaydi.
- Telegram/SEO: `og:` meta teglar, `og.png`, ikonlar, `manifest.webmanifest` (PWA o’rnatish). Telegram eski preview'ni keshlaydi: @WebpageBot ga havolani yuborib yangilang.
