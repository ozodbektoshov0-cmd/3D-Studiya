# 3D Studiya

Brauzerda ishlaydigan 3D ko’rish, tahrirlash va konvertatsiya sayti. Server kerak emas.

## v0.0.64 — MAX: gzip siqilgan fayllar ochilmasligi tuzatildi (“MAX ichida obyektlar (Node) topilmadi”)
- **Sabab 1 (asosiy):** ayrim `.max` fayllarda `Scene` va `ClassDirectory3` oqimlari **nomi o’zgarmagan holda gzip bilan siqilgan** (`1F 8B 08` bilan boshlanadi; `_Compressed` qo’shimchasi ham, zstd ham yo’q). Import ularni xom chunk deb o’qir, sahifa 0 ta chunk topar va “obyektlar (Node) topilmadi” xatosi chiqardi. **Tuzatish:** oqim gzip bo’lsa `fflate.gunzipSync` bilan ochiladi (ochilgandan keyingi tuzilma eski siqilmagan formatniki bilan bir xil). Ochilgan hajm 1,9 GB dan oshsa yoki xotira yetmasa aniq xabar beriladi.
- **Sabab 2:** shu fayllarda Editable Poly yuz yozuvi **bayroqqa bog’liq uzunlikda** (bir mesh ichida 30–40 bayt): `[d][d ta uch][bayroq u16]` + `bayroq&1` → 4 bayt (qirra bayroqlari) + `bayroq&8` → u16 (**material ID**) + `bayroq&16` → u32 (**smoothing group**) + (d−3)×8 bayt diagonal. Eski o’qigich faqat bir xil uzunlikdagi yozuvlarni tanir, shuning uchun mesh’larning katta qismi “buzuq” deb tashlab yuborilardi (sinov faylida 520 ta). Endi `scanFlg` ishlatiladi: chunk oxirigacha aniq mos kelishi va uch indekslari < nv ekani tekshiriladi. Material ID va 32 bitli silliqlash guruhi to’g’ri o’qiladi (avval material 0 edi).
- **Sabab 3:** yuz ro’yxatida bo’sh yuz (`d=0`) va juda katta ko’pburchak (`d=576`) uchraydi — avval `d<3` / `d>256` rad etilardi.
- **Sabab 4:** modifikatorlar steki **ichma-ich** Derived Object bo’lishi mumkin (masalan TurboSmooth → UVW Map → Editable Poly) — avval faqat bir daraja chuqurlikka qaralardi. Endi rekursiv qidiriladi; import xabarida qaysi modifikatorlar hisobga olinmagani ko’rsatiladi.
- `js/loader.js`: katta `.max` (20 MB dan ortiq) uchun “ochilmoqda” xabari ko’rsatiladi (ochish bir necha soniya olishi mumkin).
- Sinov: 1 ta haqiqiy fayl (UZ_AVTO01.max, 212 MB gzip → 633 MB ochilgan, 2934 obyekt) — avval xato; endi ≈9,5 mln uchburchak o’qiladi. O’qilmaydigan qismlar: Particle View, spline’lar (Line/Rectangle/Text + Extrude), kamera/yorug’lik. **Eslatma:** bunday katta sahna uchun brauzerga ≈2–3 GB xotira kerak; telefonda xotira yetmasligi mumkin.

## v0.0.63 — MAX: ayrim yangi 3ds Max fayllari (“o’qiladigan mesh topilmadi”) tuzatildi
- **Sabab 1:** siqilgan `Scene` oqimi sarlavhasining uzunligi noto’g’ri tanlanardi. Bir nechta siljish (12, 14, 20, 30) chunk zanjirini oqim oxirigacha “yetkazib” qo’yishi mumkin, faqat 14 to’g’ri edi; 12 tanlanib, 29 mingta soxta chunk hosil bo’lardi va hamma obyekt “noma’lum” bo’lib qolardi. **Tuzatish:** chunk id’lari ClassDirectory3 dagi sinflar soniga eng ko’p sig’adigan siljish tanlanadi.
- **Sabab 2:** modifikator (masalan TurboSmooth) qo’yilgan obyektlar (Derived Object) ClassDirectory3 da yo’q, o’rnatilgan chunk id `0x2032` bilan keladi — ular o’qilmasdi. Endi shu id Derived Object deb tanib olinadi va ostidagi Editable Mesh/Poly o’qiladi (modifikatorning o’zi qo’llanmaydi).
- Sinov: V-Ray 7 sahnasi (3ds Max 2024+, 18 obyekt) — avval xato, endi ≈38 ming uchburchak ochiladi. Yorug’lik va kameralar (VRaySun, VRayPhysicalCamera, Target) o’qilmaydi.

## v0.0.62 — MAX: yangi 3ds Max (2024+) fayllari ochilmasligi tuzatildi
- **Sabab:** yangi 3ds Max `.max` ichidagi oqimlarni siqib saqlaydi (`Scene_Compressed`, `ClassDirectory3_Compressed` … — 2 bayt `FF FF` + **zstd** kadr). Import faqat siqilmagan `Scene`/`ClassDirectory3` ni qidirgani uchun “MAX ichida Scene/ClassDirectory3 topilmadi” xatosi chiqardi.
- **Tuzatish:** `js/zstd.js` — sof JS zstd dekoder (RFC 8878, kutubxonasiz; lug’at va checksum tekshiruvi yo’q). `js/maxread.js` siqilgan oqimlarni ochadi, ochilgan oqim boshidagi sarlavhani (ClassDirectory3: 6 bayt, Scene: 14 bayt) chunk zanjiri oxirigacha aniq yetib borishi bo’yicha aniqlaydi. Eski (siqilmagan) fayllar uchun yo’l o’zgarmagan.
- **Editable Poly yuz yozuvi** yangi Maxda boshqacha: sarlavha 10 emas 6 bayt, silliqlash guruhi esa birinchi baytdagi `0x08` biti o’rnatilgan yuzlarda ixtiyoriy 2 bayt sifatida keladi (bo’lmasa guruh 0). Ikkala variant chunk hajmiga aniq mos kelishi tekshiriladi; mos kelmasa mesh “buzuq” deb sanaladi (noto’g’ri geometriya hosil qilinmaydi).
- **Masshtab (`ScaleXYZ`):** yangi Maxda obyekt masshtabi odatda `ScaleXYZ` kontrolleri (X, Y, Z alohida) bilan saqlanadi, avval faqat `Bezier Scale` o’qilar edi — masshtab butunlay e’tiborsiz qolib, qismlar joyidan siljirdi (salon kuzovdan chiqib ketgan, bagaj qopqog’i ochiq, chiroq uzoqda ko’rinardi). Endi ikkala kontroller o’qiladi; qiymat topilmasa 1 olinadi.
- Sinov: 1 ta haqiqiy fayl (3ds Max 2024+, avtomobil sahnasi, 222 mesh, ≈405 ming uchburchak) — hamma mesh o’qiladi. Silliqlash guruhi maydonining ma’nosi shu fayldagi tuzilma va geometriyadan **taxmin qilingan** (Max hujjatlashtirmagan); material ID yangi poly’larda hamon 0.
- Yangi test: `tools/test.js` da zstd dekoder (ko’p blokli, RLE va Huffman/FSE kadrlar).

## v0.0.61 — MAX: parametrik obyektlar
- `.max` import endi **Box, Cylinder, Sphere, GeoSphere, Plane, Cone, Torus** parametrik obyektlarini ham yaratadi (ParamBlock2 dagi o’lchamlardan; Derived Object / modifikator ostidagi bazaviy obyekt ham). Segmentlar standart. Import xabarida “parametrik (taxminiy o’lcham)” deb ko’rsatiladi.
- Boshqa turlar (Teapot, Tube, Pyramid, splaynlar, modifikatorlar natijasi…) hamon o’qilmaydi va xabarda sanab o’tiladi.
- Eslatma: ParamBlock2 parametr tartibi ochiq hujjatlanmagan, shuning uchun tartib taxminiy; sintetik fayl bilan tekshirilgan, haqiqiy Max fayllari bilan tasdiqlanmagan.

## v0.0.60 — yangi import/eksport formatlari va GTA paketlari
- **Import:** DXF, SVG (3D ga extrude), KMZ — ko’rinmas “format dvigateli” (`js/engine.js` + `apps/3d-model`) orqali. 3DS importi tekshirildi (eksport qilingan 3DS qayta ochiladi).
- **Eksport:** 3DS, COL, IDE, IPL; **GTA mashina: DFF + TXD** (zip); **GTA obyekt: DFF + TXD + COL + IDE + IPL** (zip). IDE/IPL parametrlari (model/TXD nomi, ID, masofa, flags, joy, interior) eksport dialogida so’raladi va eslab qolinadi. DFF/TXD studiyaning o’z yozuvchilari bilan, COL esa dvigatel bilan yaratiladi (`js/gtapack.js`).
- **MAX:** xato xabari aniqlashtirildi — faqat Editable Mesh/Poly o’qiladi; parametrik obyektlar uchun Convert To → Editable Poly yoki FBX/3DS/OBJ tavsiya etiladi.

## v0.0.59 — outliner daraxti va ko’p tanlash
- **Outliner** endi faqat mesh emas, nomli **dummy / freym / guruh**larni ham ko’rsatadi (DFF freymlari, GLB/OBJ guruhlari). Har biri **▾ / ▸** bilan ochiladi-yopiladi — ichidagi mesh geometriyalar ko’rinadi yoki yashirinadi. Sarlavhada **▾▾ / ▸▸** — hammasini ochish / yopish. Guruh qatorini bosish ichidagi hamma meshni tanlaydi, ko’z belgisi butun guruhni yashiradi.
- **Hammasini belgilash** (yoki 2+ obyekt tanlash): bitta meshning Joy / Burilish / O’lcham maydonlari yashiriladi, o’rniga **“Tanlanganlar: N ta — hammasiga birdaniga”** paneli chiqadi (markaz atrofida joy, burilish, o’lcham). Gizmo ham hammasiga ta’sir qiladi.
- **O’chirish** (tugma, X, Delete) tanlangan **hamma** obyektni o’chiradi (Undo ham hammasini qaytaradi).
- `tools/check.js` endi `v0.0.59` kabi nuqtali versiyalarni tushunadi.

## v52 — soddaroq interfeys, yangi dizayn, telefonda gorizontal
- **Soddalashtirish:** yuqori panelda faqat Fayl · Tahrir · Qo’shish · Obyekt qoldi, qolgan 11 ta menyu (Material, Asboblar, GTA, Studiya+ …) bitta **Boshqa** menyusi ichida akkordeon bo’lib turadi — hech narsa o’chmagan. Ko’rish oynasida asosiy tugmalar ochiq, qolgani (**Ko’p tanlash, Ramka, X-ray, Magnit…**) **⋯** ortida (Edit rejimida o’zi ochiladi). Vaqt chizig’i faqat **Animatsiya** ish maydonida ko’rinadi, holat panelida 3 ta hisoblagich, Outliner’dagi ikkita bezak qator olib tashlandi.
- **Dizayn:** bitta aksent rang (amber), yangi grafit palitra, yumaloqroq dialog va menyular, barmoq uchun kattaroq tugmalar, notch uchun xavfsiz maydonlar.
- **Telefon gorizontal:** `manifest` → `orientation: landscape` (o’rnatilgan ilova); oddiy brauzerda birinchi bosishda to’liq ekran + `screen.orientation.lock('landscape')`; iPhone kabi qulf yo’q joyda “Telefonni yoting” oynasi (“Baribir davom etish” bilan yopiladi). Gorizontal telefonda ko’rish oynasi butun ekran, **Panel** tugmasi o’ng tomondan Outliner/Properties/ish maydonlarini ochadi.
- Yangi fayllar: `css/simple.css`, `js/simple.js`. Service Worker `v52`.
- Cheklov: arab tilida yangi yozuvlar (“Boshqa”, “Telefonni yoting”) hozircha o’zbekcha qoladi.

## v51 — rig vaznlari
- **Studiya+ → Vazn xaritasi:** tanlangan avto-rig qilingan mesh uchun bitta suyakning ta’sirini rangda ko’rsatadi (ko’k 0 → yashil 0.5 → qizil 1). Yana bosilsa o’chadi va asl rang/material qaytadi. **Eksportdan oldin o’chiring** (xarita vertex rangi sifatida eksportga tushib qoladi).
- **Vaznlarni silliqlash:** har uchning suyak vaznlarini qo’shnilari bilan aralashtiradi (1–20 qadam), eng kuchli 4 ta ta’sir qoladi va yig’indi 1 ga normallanadi. Avto-rigning faqat ikki suyakli chiziqli vazni egilganda yumshoqroq bo’ladi. Undo bilan qaytariladi.
- Cheklov: vaznni qo’lda bo’yash (cho’tka) hali yo’q; silliqlash uchlar geometrik qo’shnisiga qaraydi, suyak joylashuviga emas.
- Ichki: `adjacency()` umumiy yordamchi (silliqlash ham shundan foydalanadi); testlar yangilandi.

## v50 — teshiklarni yopish
- **Studiya+ → Teshiklarni yopish:** tanlangan meshdagi ochiq chekka halqalarini topadi (har bir teshik alohida) va markaz nuqtaga “fan” uchburchaklar bilan yopadi. Yo’nalish qo’shni yuzalarga mos chiqadi, shuning uchun keyin **Mesh tekshiruvi** watertight deydi. UV/normal/rang atributlari saqlanadi (yangi uchlar chekka uchlaridan nusxalanadi), material guruhi bo’lsa yangi uchburchaklar birinchi materialga qo’shiladi. Bitta Undo bilan qaytariladi.
- Cheklov: markazga fan — kichik va qavariq-simon teshiklar uchun yaxshi; katta yoki egri-bugri (konkav) teshikda uchburchaklar bir-birini kesishi mumkin va silliq “yamoq” bermaydi (keyin Silliqlash yordam beradi). Yopiq halqa bo’lmagan (shoxlangan) chekkalar o’tkazib yuboriladi.

## v49 — mesh tekshiruvi
- **Studiya+ → Mesh tekshiruvi:** tanlangan mesh uchun hisobot oynasi: uchburchak/uch/qirra soni, bog’langan qismlar, **teshiklar** (ochiq chekka qirralari), manifold bo’lmagan qirralar (3+ yuza), **teskari yuzalar** (bir xil yo’nalishda takrorlangan qirra), buzuq uchburchaklar, **watertight** (3D bosib chiqarish/STL uchun) va yopiq jism uchun genus.
- Bir xil joydagi uchlar birlashtirilib hisoblanadi (UV choki va non-indexed meshlar to’g’ri chiqadi); silliqlash ham shu umumiy `topo()` dan foydalanadi.
- Cheklov: faqat topologiyani **ko’rsatadi** (teshikni yopmaydi, teskari yuzani o’zi tuzatmaydi), kesishuvchi (o’zini kesadigan) yuzalarni aniqlamaydi.

## v48 — silliqlash
- **Studiya+ → Silliqlash (Taubin):** tanlangan mesh yuzasini tekislaydi (1–50 qadam), lekin oddiy Laplace kabi jismni kichraytirmaydi (λ=0.6307, μ=−0.6732). UV chokidagi bir xil joylashgan uchlar birga siljiydi (yuza yirtilmaydi), ochiq chekka uchlari joyida qoladi, normallar silliq qayta hisoblanadi. Bitta Undo bilan qaytariladi.
- Cheklov: topologiyani o’zgartirmaydi (poligon qo’shmaydi), shuning uchun kam poligonli meshda natija “yumaloq” emas, faqat tekisroq bo’ladi — avval Subdivide qiling. Qirrali (keskin) detallar ham yumshaydi.
- `tools/test.js` ga silliqlash testi qo’shildi (indexed va non-indexed shar, ochiq tekislik chekkasi).

## v47 — tekshiruv va testlar
- `node tools/check.js` — statik tekshiruv: hamma skript mavjudmi va sintaksisi to’g’rimi, `js/` dagi fayl `index.html` ga ulanganmi, global e’lonlar to’qnashmaydimi, `sw.js` keshi diskka aniq mosmi, README versiyasi `sw.js` bilan bir xilmi.
- `node tools/test.js` — Studiya+ testlari (avto-rig vaznlari va egilishi, `.s3dp` saqlash → ochish). Brauzer yoki npm kerak emas, faqat Node 18+.
- `.github/workflows/check.yml` — GitHub’ga yuklaganda ikkalasi avtomatik ishlaydi. **Yangi versiya chiqarganda** `sw.js` dagi `V` va README’ning birinchi `## vNN` sarlavhasini birga oshiring, aks holda `check.js` xato beradi.
- Testlar Three.js r147 bilan yozilgan; yangilaganda `test.js` dagi `boneTransform` → `getVertexPosition` moslashuvi allaqachon bor.

## v46 — loyiha fayli
- **Studiya+ → Loyihani saqlash / ochish (`.s3dp`, Ctrl+S):** butun sahna (yashirin meshlar, dummylar va `userData` bilan, GLB ichida), kamera joyi va fon rangi bitta faylda. Format: `S3DP` + u32 JSON uzunligi + JSON + GLB. Ochilganda `Fayl → Ochish` yoki sudrab tashlash ham ishlaydi.
- Cheklov: material GLB orqali o’tadi (Phong/Lambert → Standard), tahrir tarixi (Undo) saqlanmaydi, ochilgan loyiha mavjud sahnaga qo’shiladi (almashtirmaydi). Service Worker `v46`.

## v45 — Studiya+ (`js/studio-plus.js`)
Prisma3D va ZModeler ilovalarida ko’rilgan imkoniyatlarning **noldan yozilgan** variantlari (ularning kodi yoki resurslari ishlatilmagan). Menyu: **Studiya+**.
- **Video yozish:** viewport’ni `.webm` ga yozadi (to’xtatish — yana bosing). **Turntable 360°** — model 8 soniyada aylanadi, panjara va tanlov ramkasi yashiriladi.
- **Avto-rig:** tanlangan oddiy meshga eng uzun o’q bo’ylab 2–24 ta suyak zanjiri va chiziqli vaznlar beradi (SkinnedMesh). **Poza: egish** bilan tekshiriladi; Skelet menyusi va GLB eksporti shu skeletni ko’radi.
- Cheklov: faqat bitta zanjir (odam skeleti emas), vaznlar balandlik bo’yicha — murakkab shakllarda qo’lda sozlash kerak bo’ladi. Meshning bolalari bo’lsa avval ajrating.
- Service Worker `v45`.

## v41 — GTA IV (WFT / WDR / WTD) qo’llab-quvvatlash
- **Yangi fayl: `js/wft.js`.** GTA IV resurslari (RSC5: 12 bayt sarlavha + zlib) ochiladi:
  - **`.wft`** (mashina fragmenti) va **`.wdr`** (oddiy drawable): yuqori LOD, barcha geometriyalar, normal va UV, material → tekstura nomi (shaderning diffuse parametridan).
  - **`.wtd`** (tekstura lug’ati): DXT1/DXT3/DXT5 (va 32-bit A8R8G8B8) teksturalar dekodlanib, nom bo’yicha materiallarga avtomatik qo’llanadi.
- Foydalanish: `Fayl → Ochish` yoki sudrab tashlang: `admiral.wft` + `admiral.wtd` (+ umumiy `vehshare.wtd` — `windows`, `vehicle_generic_*` kabi teksturalar shu yerda bo’ladi). Tartibi muhim emas.
- Koordinatalar GTA V bilan bir xil: Z-up → Y-up, mashina old tomoni −Z.
- Cheklovlar: skelet/fragment bo’laklari (eshiklar, g’ildiraklar harakati) hali o’qilmaydi, faqat statik model; LOD faqat eng yuqori; WTD ichidagi DXT dan boshqa siqilgan formatlar o’tkazib yuboriladi (xabarda soni chiqadi).
- Service Worker `v41`.

## v40 tuzatishlari
- **Rasmdan 3D** butunlay qayta yozildi (`js/img3d.js`):
  - **Logo / Siluet** endi panjara emas — **kontur izlash + Ramer–Douglas–Peucker soddalashtirish + ear-clip triangulyatsiya**.
  - Natija: silliq, aniq chegara, juda kam poligon (odatda 200–2000 uchburchak).
  - Otsu + morfologik tozalash saqlanib qoldi.
  - «Kontur silliqligi» slayderi qo‘shildi (1.0–2.0 tavsiya).
  - Relyef rejimi eski panjara usulida qoldi (heightmap uchun).
- Service Worker `v40`.

## v39 tuzatishlari
- Rasmdan 3D dastlabki yaxshilanishlar (Otsu, morfologiya, logo aniqlash).

## Mashina funksiyalari (v38)
`Mashina` workspace’i / Properties’dagi mashina tabi / yuqoridagi `Mashina` menyusi (`js/carfx.js`).
- **Qismlarni topish:** “Avto-aniqlash” nomlar bo’yicha (door_lf, bonnet, boot, headlight, taillight, indicator, wiper, steering, speedo… GTA nomlari ham) topadi; chap/o’ng va old/orqa joylashuv geometriyadan olinadi. Topilmaganini qo’lda belgilang: modelda qismni tanlang → rolni tanlang → “Tanlanganni belgilash”. Old tomon avtomatik yoki qo’lda (±X/±Z).
- **Ochiladigan qismlar:** 4 ta eshik, old kapot, bagaj kapoti (sharnir chekkasi va yo’nalish geometriyadan hisoblanadi), tom lyuki (orqaga suriladi), 4 ta oyna (tushadi), 2 ta bakavoy (qayriladi).
- **Rul** (burchak slayderi), **artgich** (sekin/tez, o’chirilsa joyiga qaytadi), **spidometr va tahometr** strelkalari (tezlik slayderi, “Demo haydash”, strelka yo’li va yo’nalishi sozlanadi).
- **Chiroqlar:** fara (yaqin/uzoq, nur va yaltirash), gabarit, stop-signal (alohida qism bo’lmasa orqa chiroq yonadi), orqaga yurish, tuman, povorotniklar (chap/o’ng/avariya, panel strelkalari ham miltillaydi), salon plafoni va panel chiroqchalari (dvigatel yoqilganda).
- Ierarxiya o’zgarmaydi: qism o’z position/quaternion’i bilan harakatlanadi; **eksport paytida hammasi yopiq holatda yoziladi**. Yaltirash materialning emissive’i, nur esa sahnada (root’dan tashqarida) — eksportga kirmaydi.
- Cheklov: rul/artgich/strelka alohida mesh bo’lishi kerak (kuzovga qo’shilib ketgan bo’lsa harakatlanmaydi). Oyna eshik ichiga kirib ketadi (kesish yo’q). Harakatlar GLB klipiga yozilmaydi (hozircha faqat ko’rish va tekshirish uchun).

## v38 tuzatishlari
- **DFF import:** kesilgan yoki PS2 (konsol) DFF’larda “Offset is outside the bounds of the DataView” deb tushunarsiz xato chiqardi. Endi chunk o’qish fayl uzunligidan chiqmaydi va xabar aniq: “PS2 native DFF qo’llanmaydi (PC versiyadagi DFF kerak)” yoki “fayl to’liq emas”. PS2 native geometriyasi (flags 0x01000000) hali o’qilmaydi.

## v37 tuzatishlari
- **USDZ eksport bo’sh fayl chiqarardi** (OBJ/STL/PLY/FBX kabi Phong/Lambert materialli modellarda): eksport vaqtida vaqtincha Standard materialga almashtiriladi.
- **SKP import:** har bir yuzaning orqa tomoni alohida (qizil) mesh bo’lib kelib, uchburchaklarni ikki baravar qilardi — endi olib tashlanadi, yuzalar ikki tomonlama.
- **Service worker** eski kodni ko’rsatib turardi (avval kesh) — endi HTML/JS/CSS avval tarmoqdan olinadi.
- **Properties bo’limlari `data-p` atributi** `tools.js` dagi material-preset tugmalari bilan to’qnashib, panel ichida bosganda “Mesh tanlang” xabari chiqarardi — `data-pp` ga o’zgartirildi.
- Ingliz/rus tilida tarjimasiz qolgan menyu matnlari (Tuzilma, Yuza, Skelet, Klip va ularning bandlari) qo’shildi; `og.png` oflayn keshga qo’shildi.

## Blender uslubidagi interfeys (v37)
- **Workspace tablari:** Maket · Modellash (Edit rejimiga o’tadi) · Materiallar (Material tabini ochadi) · Animatsiya (kadr chizg’ichi chiqadi).
- **Viewport sarlavhasi:** rejim tanlagich (Obyekt/Edit) va ko’rinish tugmalari; ko’rinish yorlig’i (masalan “Old · Perspektiva”).
- **Navigatsiya gizmosi** (o’ng yuqorida): X/Y/Z doirasini bosing — shu tomondan ko’rinish; lupa (sudrang: yaqinlashtirish, bosish: modelga moslash), qo’l (siljitish), perspektiva/ortho.
- **Outliner:** Sahna to’plami → To’plam daraxti, ko’z belgisi bilan ko’rsatish/yashirish.
- **Properties:** vertikal tablar — Obyekt (nom, transformatsiya), Material, Teksturalar; yig’iladigan panellar.
- **Timeline:** ijro/pauza (Probel), kadrga qadam (← →), boshiga/oxiriga (Shift+← →), kadr, boshi/oxiri, tezlik; Animatsiya workspace’ida kalitlar (Klip menyusi) ko’rinadigan chizg’ich va sudrab o’tish.
- **Holat paneli:** obyekt/uch/uchburchak soni, rejim, asbob, ko’rinish, magnit, bekor/qaytarish, kadr, ijro, animatsiya, tanlangan nom.
- Yangi fayllar: `css/blender.css`, `js/blender-ui.js` (ikonkalar shu yerda, hammasi o’zimiz chizgan SVG). Mavjud funksiyalar (GTA, SKP, Z3D, Detalni moslashtirish va h.k.) o’zgarmagan.
- Til: O’zbekcha / English / Русский / العربية — arab tili to’liq (RTL, o’ngdan chapga tartib; interfeys, xabarlar, prompt oynalari). Yangi matnlar lug’atga qo’shilgan. SEO: keywords, Twitter teglari, JSON-LD.

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
- `js/i18n-ar.js` — arabcha tarjima: kalit — o’zbekcha matn, qiymat — arabcha; dinamik xabarlar (raqamli) uchun pastdagi `F` regex ro’yxati. Yangi o’zbekcha matn qo’shsangiz, shu yerga arabchasini ham qo’shing.
- `vendor/` — Three.js (sayt internetsiz ham ishlaydi)
- `sw.js` — oflayn kesh: kod va HTML avval tarmoqdan olinadi (yangilanish darrov ko’rinadi), internet bo’lmasa keshdan; `vendor/` keshdan. Versiya nomi `sw.js` boshidagi `V` da

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

## O’yin rejimi (v43)
- Yuqoridagi **O’yin** tugmasi: avval mashinani import qiling va “Mashina” panelida sozlang (eshik, chiroq, rul…), so’ng xarita tanlab haydang.
- Xaritalar: **Shahar** (svetoforlar, trafik, piyodalar), **Cho’l yo’li**, **Poyga trassasi** (raqib mashinalar, tomoshabinlar).
- Boshqaruv: W/S/A/D yoki strelkalar, Probel — qo’l tormozi, H — chiroq, Q/E/Z — povorotnik/avariya, 1–8 — eshik/kapot/bagaj/lyuk/oynalar, Y — artgich, C — kamera, N — tun/kun, M — ovoz, R — joyiga qaytarish, Esc — chiqish. Telefonda ekrandagi tugmalar bor.
- Kod: `js/game.js`, `css/game.css`. Yangi xarita qo’shish: `MAPS` ro’yxatiga `build` funksiyasi qo’shiladi.
- v44: mini-xarita, poyga aylanish vaqti (eng yaxshi aylanish), mashina soyasi, tungi ko’cha chiroqlari, to’qnashuv ovozi va kamera silkinishi, pauza (P), uzatmalar va tezlik tarozisi.

## Blender bosqichlari (0.0.53 – 0.0.58)
- 0.0.53: Add menyusiga Circle, Grid, Ico Sphere, Suzanne; Shift+A.
- 0.0.54: Obyekt menyusiga Apply Transform, Subdivide, Array, Mirror, Auto Smooth.
- 0.0.55: Edit rejimi: Extrude, Inset, Delete, Merge, tanlash asboblari.
- 0.0.56: OBJ+MTL (ZIP) eksport, MTL import, ASCII STL/PLY.
- 0.0.57: Sozlamalarda “Blender” bo‘limi (sichqoncha boshqaruvi, Shift+A, Edit paneli, statistika, Auto Smooth burchagi, Blender mavzusi), F1 — yorliqlar xaritasi.
- 0.0.58: Subdivision Surface (Catmull–Clark): Obyekt menyusida, daraja 1–4.

## Versiya raqamlash
`MAJOR.MINOR.PATCH` (masalan 0.0.57). Kichik tuzatish va qo‘shimchalar — PATCH oshadi; yirik yangi imkoniyat (masalan, modifier stack) — MINOR oshadi (0.1.0); 1.0.0 — barqaror birinchi reliz.
