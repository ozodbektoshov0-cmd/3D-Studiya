# 3D Studiya

Brauzerda ishlaydigan 3D ko’rish, tahrirlash va konvertatsiya sayti. Server kerak emas.

## Blender uslubidagi interfeys (v37)
- **Workspace tablari:** Maket · Modellash (Edit rejimiga o’tadi) · Materiallar (Material tabini ochadi) · Animatsiya (kadr chizg’ichi chiqadi).
- **Viewport sarlavhasi:** rejim tanlagich (Obyekt/Edit) va ko’rinish tugmalari; ko’rinish yorlig’i (masalan “Old · Perspektiva”).
- **Navigatsiya gizmosi** (o’ng yuqorida): X/Y/Z doirasini bosing — shu tomondan ko’rinish; lupa (sudrang: yaqinlashtirish, bosish: modelga moslash), qo’l (siljitish), perspektiva/ortho.
- **Outliner:** Sahna to’plami → To’plam daraxti, ko’z belgisi bilan ko’rsatish/yashirish.
- **Properties:** vertikal tablar — Obyekt (nom, transformatsiya), Material, Teksturalar; yig’iladigan panellar.
- **Timeline:** ijro/pauza (Probel), kadrga qadam (← →), boshiga/oxiriga (Shift+← →), kadr, boshi/oxiri, tezlik; Animatsiya workspace’ida kalitlar (Klip menyusi) ko’rinadigan chizg’ich va sudrab o’tish.
- **Holat paneli:** obyekt/uch/uchburchak soni, rejim, asbob, ko’rinish, magnit, bekor/qaytarish, kadr, ijro, animatsiya, tanlangan nom.
- Yangi fayllar: `css/blender.css`, `js/blender-ui.js` (ikonkalar shu yerda, hammasi o’zimiz chizgan SVG). Mavjud funksiyalar (GTA, SKP, Z3D, Detalni moslashtirish va h.k.) o’zgarmagan.
- Til: O’zbekcha / English / Русский (yangi matnlar lug’atga qo’shilgan). SEO: keywords, Twitter teglari, JSON-LD.

## Detalni moslashtirish (v36)
`Asboblar → Detalni moslashtirish (donor → maqsad)…` — bir mashinaning detalini (masalan BMW old bamperi) boshqa mashinaga (masalan Nexia 2) avtomatik moslab qo’yadi (`js/fitpart.js`).
1. Donor detalni tanlab “Tanlanganni donor qil”, maqsad (o’rniga qo’yiladigan eski detal) ni tanlab “Tanlanganni maqsad qil” ni bosing.
2. **O’lcham va yo’nalish:** donor maqsadning chegara qutisiga X/Y/Z bo’yicha cho’zilib yoki qisqarib joylashadi; Y o’qi atrofida 0/90/180/270° dan eng kam cho’zilishi avtomatik tanlanadi (yoki qo’lda). “Nisbatni saqlash” — bir xil masshtab.
3. **Qirqish:** maqsad qutisidan (zaxira bilan) chiqib ketgan qism tekislik bo’yicha kesiladi (UV, normal, material guruhlari saqlanadi).
4. **Yopishtirish:** kuzovga yaqin uchlar (masofa % da) kuzov sirtiga tortiladi: oraliq yopiladi, chekkalari silliq o’tadi.
5. Eski detal yashiriladi / o’chiriladi / qoldiriladi. Hammasi bitta Undo bilan qaytariladi.
- Ogohlantirish: masshtab ×3 dan ortiq (yoki 1/3 dan kam) bo’lsa, detallar bir-biriga mos emasligi haqida xabar chiqadi.
- Cheklov: bu qutilar va sirt masofasiga asoslangan moslash. Murakkab shaklni (masalan panjara ichidagi tafsilotlar) o’zgartirmaydi va uni qo’lda sozlash kerak bo’lishi mumkin.

## Rasmdan 3D (v35)
`Qo’shish → Rasmdan 3D…` — PNG/JPG/WEBP rasmdan 3D model yasaydi (`js/img3d.js`). Hammasi brauzerda bajariladi.
- **Relyef:** yorqinlik balandlikka aylanadi (yengil piksel — baland). Shaffof (PNG) joylar kesib tashlanadi.
- **Siluet:** rasm konturi bo’yicha bir xil qalinlikda cho’zadi (qorong’i obyekt — och fonda, yoki shaffof fon). “Teskari” — aksi.
- Sozlamalar: kenglik, balandlik/qalinlik, asos qalinligi, aniqlik (32–256 panjara), yumshatish, siluet chegarasi, teskari, rasmni tekstura qilish.
- Natija yopiq (suv o’tkazmaydigan) jism: yuqori sirt + tekis tag + devorlar, shuning uchun STL (3D bosib chiqarish) ga yaraydi. Tekstura nomi saqlanadi va DFF eksportda TXD ga o’tadi.
- Cheklov: bu chuqurlikni “taxmin qiluvchi” sun’iy intellekt emas — balandlik rasm yorqinligidan olinadi. Odam yuzi yoki manzara fotosida haqiqiy hajm chiqmaydi; eng yaxshi natija: logotip, chizma, qora-oq rasm, belgi va lithophane uchun.

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
- `js/settings.js` — **Sozlamalar** (sifat, FPS, FXAA, soya, yoritish, kamera, interfeys, fayllar) va **Ilova haqida** oynalari; sozlamalar `localStorage` da saqlanadi
- `js/blender-ui.js` — Blender uslubidagi interfeys qatlami (workspace, gizmo, outliner, timeline, holat paneli)
- `css/blender.css` — Blender uslubidagi dizayn (style.css ustiga)
- `js/i18n.js` — dastur tili (O’zbekcha / English / Русский): lug’at shu faylning boshida, yangi matn qo’shish oson
- `vendor/` — Three.js (sayt internetsiz ham ishlaydi)
- `sw.js` — oflayn kesh: kod va HTML tarmoqdan olinadi (yangilanadi), `vendor/` keshdan. Versiya nomi `v24`

## Ishga tushirish
`python -m http.server 8000` va brauzerda `localhost:8000`. GitHub Pages yoki Vercel’ga shu papkani o’zini yuklash yetarli.

## SKP qo’llab-quvvatlash (SketchUp)
- `js/skp.js` — `.skp` import va eksport ([OpenSKP](https://github.com/iamahsanmehmood/openskp), MIT). Kutubxona avval `vendor/openskp.min.js` dan, bo’lmasa CDN’dan (jsDelivr, internet kerak) yuklanadi.
- **Import:** SketchUp 2013–2025. Yuklanganda GLB orqali sahnaga qo’shiladi.
- **Eksport:** Format ro’yxatidan `skp` tanlang. SketchUp 2013–2020 formatida yoziladi (yangi SketchUp ham ochadi). 1 birlik = 1 metr, Y-up → dyuym, Z-up. Uchburchaklar yuza bo’ladi, ranglar saqlanadi, teksturalar saqlanmaydi. Chegara: 250 000 uchburchak.
- Ixtiyoriy (CDN’siz ishlatish): Node.js 18+ bilan `sh tools/build-openskp.sh` → `vendor/openskp.min.js`. `vendor/license.openskp.txt` (MIT) ni qoldiring.
- Cheklov: katta fayllar (≈100 MB+) brauzer xotirasiga sig’maydi; juda eski (V3–V6) fayllar o’qilmasligi mumkin.

## Z3D qo’llab-quvvatlash (ZModeler 3)
- `js/z3d.js` — `.z3d` import va eksport. Fayl: `Z3DM` sarlavha + zlib + chunklar. Import: meshlar (dunyo koordinatasida, Y-up), yuzalar, normallar, burchak bo’yicha UV, materiallar (rang, yaltiroqlik, shaffoflik), pivot. Har bir mesh o’z materialiga ega.
- Eksport: Format ro’yxatidan `z3d`. Ko’p materialli mesh materiallar bo’yicha ajratiladi; 65535 dan ko’p uchli mesh bo’laklanadi. Teksturalar yozilmaydi (rang saqlanadi).
- Cheklov: tekstura chunklari o’rganilmagan (namuna faylda yo’q edi), shuning uchun teksturalar o’qilmaydi; ierarxiya/animatsiya yo’q.

## Mesh asboblari (`js/mesh.js`)
- **Tuzilma:** ota/bola (Parent/Unparent), Boolean birlashtirish / ayirish / kesishma (BSP-CSG, 6000 uchburchakgacha, yopiq meshlar uchun).
- **Yuza:** yuza rejimi (tekis yuzani bosib tanlash), Extrude, Inset, o’chirish, Subdivide; UV avto (quti) va UV ×2, ÷2, 90°, aks.
- **Skelet:** skelet ko’rsatish, suyakni tanlab burish (poza), klip tanlash, tezlik.
- Hali yo’q: Bevel, keyframe yozish, vazn (skin weight) bo’yash.

## v24 qo’shimchalari
- GTA V YFT/YTD: sarlavhasi ikki marta yozilgan fayllar ochiladi; g’ildirak modeli barcha g’ildirak bo’g’imlariga qo’yiladi (o’ng tomon ko’zgu); qismlar skelet bo’g’im nomi bilan nomlanadi.
- LOD nusxalar, ko’zgu nusxa (X/Y/Z, chap/o’ng nomlari almashadi), X-ray, ramka bilan tanlash, material bo’yicha tanlash.
- Asboblar: teskari tanlash, tozalash, hammasini ko’rsatish/yashirish, faqat tanlanganni ko’rsatish, uchlarni birlashtirish (weld), normallarni teskari qilish / burchak bo’yicha qayta hisoblash, ajratish (bog’langan qismlar / material), tayanch nuqtani markazlash. Eksport: “Faqat tanlanganlar”.
- GTA menyusi: avtomobil ierarxiyasini tekshirish, yetishmagan dummy va _ok/_dam juftlarini yaratish.
- DFF eksport: 65535 dan ko’p uchli meshlar avtomatik birlashtiriladi va qismlarga bo’linadi; materiallar birlashtiriladi, ishlatilmagani yozilmaydi; frame nomlari noyob; vertex ranglar (prelit).
- Boshqa formatdan importda tekstura nomi saqlanadi (rasm topilmasa ham) va DFF/TXD ga o’tadi.
- SKP import va eksport (OpenSKP).
- `.max` import (`js/maxread.js`): Editable Mesh/Poly, joylashuv/aylanish/o’lcham, pivot, ota-bola, instance, UV, smoothing group, Multi/Sub material (nom, rang, tekstura nomi). Parametrik obyektlar (Box, Sphere…) va modifikatorlar o’qilmaydi.

## v18 qo’shimchalari
- Chamfer (yuza), Klip menyusi (keyframe yozish → GLB/GLTF eksportga qo’shiladi).
- Kam ishlatiladigan yuklagichlar (FBX, DAE, WRL, 3MF, 3DS, LWO, MMD...) kerak bo’lganda yuklanadi — boshlang’ich yuklanish ≈0.8 MB kamaydi.
- Telegram/SEO: `og:` meta teglar, `og.png`, ikonlar, `manifest.webmanifest` (PWA o’rnatish). Telegram eski preview'ni keshlaydi: @WebpageBot ga havolani yuborib yangilang.
