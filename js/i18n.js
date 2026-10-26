/* ---- Dastur tili: O’zbekcha (asl matn) / English / Русский ----
   Interfeys matnlari o’zbekcha yozilgan. Til almashganda matn va title atributlari lug’at bo’yicha almashtiriladi.
   Lug’atda yo’q matn o’zbekcha qoladi. Yangi matn qo’shish: pastdagi ro’yxatga “o’zbekcha|English|Русский” qatorini qo’shing. */
(function(){
const raw=`
Fayl|File|Файл
Tahrir|Edit|Правка
Qo’shish|Add|Добавить
Obyekt|Object|Объект
Material|Material|Материал
Asboblar|Tools|Инструменты
Model|Model|Модель
Ko’rinish|View|Вид
Ochish (import)…|Open (import)…|Открыть (импорт)…
DFF bilan TXD|DFF with TXD|DFF вместе с TXD
Faqat tanlangan|Selected only|Только выбранное
Eksport|Export|Экспорт
TXD eksport|Export TXD|Экспорт TXD
Render (PNG)|Render (PNG)|Рендер (PNG)
Render (PNG) tayyor|Render (PNG) is ready|Рендер (PNG) готов
Bekor qilish · Ctrl+Z|Undo · Ctrl+Z|Отменить · Ctrl+Z
Qaytarish · Ctrl+Y|Redo · Ctrl+Y|Повторить · Ctrl+Y
Nusxa · Shift+D|Duplicate · Shift+D|Дублировать · Shift+D
O’chirish · X|Delete · X|Удалить · X
Dummy…|Dummy…|Дамми…
Kub|Cube|Куб
Shar|Sphere|Сфера
Silindr|Cylinder|Цилиндр
Konus|Cone|Конус
Halqa|Torus|Тор
Tekislik|Plane|Плоскость
Markazni o’rnatish|Set origin|Установить центр
Silliq / qirrali|Smooth / flat|Гладкий / гранёный
Ko’zgu X|Mirror X|Зеркало X
Ko’zgu Y|Mirror Y|Зеркало Y
Ko’zgu Z|Mirror Z|Зеркало Z
Yashirish / ko’rsatish|Hide / show|Скрыть / показать
Hamma meshlarga|Apply to all meshes|Ко всем мешам
Chrome (yaltiratish)|Chrome (polished)|Хром (полировка)
Yaltiroq bo’yoq|Glossy paint|Глянцевая краска
Oyna|Glass|Стекло
Mat|Matte|Матовый
Poligon kamaytirish (% qoladi)|Reduce polygons (% kept)|Уменьшить полигоны (% остаётся)
Yengil mashina 4.5 m|Car 4.5 m|Легковой автомобиль 4.5 м
Kichik mashina 3.8 m|Small car 3.8 m|Малолитражка 3.8 м
Sedan / politsiya 5.0 m|Sedan / police 5.0 m|Седан / полиция 5.0 м
Jip / furgon 5.2 m|SUV / van 5.2 m|Джип / фургон 5.2 м
Yuk mashinasi 7.5 m|Truck 7.5 m|Грузовик 7.5 м
Avtobus 11 m|Bus 11 m|Автобус 11 м
Mototsikl 2.1 m|Motorcycle 2.1 m|Мотоцикл 2.1 м
Velosiped 1.7 m|Bicycle 1.7 m|Велосипед 1.7 м
Odam (bo’yi 1.8 m)|Person (height 1.8 m)|Человек (рост 1.8 м)
Avto razmer|Auto size|Авто-размер
Yerga qo’yish va markazlash|Place on ground and center|Поставить на землю и центрировать
Attach (birlashtirish)|Attach (merge)|Attach (объединить)
Detach (ajratish)|Detach (separate)|Detach (разделить)
Joyini almashtirish (2 obyekt)|Swap positions (2 objects)|Поменять местами (2 объекта)
Birinchisini ikkinchisiga qo’yish|Move first to second|Поставить первый на второй
Reset to parent (o’qlarni tekislash)|Reset to parent (align axes)|Reset to parent (выровнять оси)
Teskari tanlash|Invert selection|Инвертировать выбор
Tanlovni tozalash|Clear selection|Снять выделение
Hammasini ko’rsatish|Show all|Показать всё
Hammasini yashirish|Hide all|Скрыть всё
Faqat tanlanganni ko’rsatish|Show selected only|Показать только выбранное
Uchlarni birlashtirish (weld)|Weld vertices|Объединить вершины (weld)
Normallarni teskari qilish|Flip normals|Перевернуть нормали
Normallarni qayta hisoblash (burchak)|Recalculate normals (angle)|Пересчитать нормали (угол)
Ajratish: bog’langan qismlar|Separate: connected parts|Разделить: связанные части
Ajratish: material bo’yicha|Separate: by material|Разделить: по материалу
Tayanch nuqtani markazlash|Center pivot point|Центрировать опорную точку
LOD nusxalar yaratish|Create LOD copies|Создать копии LOD
Ko’zgu nusxa X|Mirror copy X|Зеркальная копия X
Ko’zgu nusxa Y|Mirror copy Y|Зеркальная копия Y
Ko’zgu nusxa Z|Mirror copy Z|Зеркальная копия Z
Material bo’yicha tanlash|Select by material|Выбрать по материалу
Avtomobil ierarxiyasini tekshirish|Check vehicle hierarchy|Проверить иерархию автомобиля
Yetishmagan dummylarni yaratish|Create missing dummies|Создать недостающие дамми
Yetishmagan _ok/_dam juftlarini yaratish|Create missing _ok/_dam pairs|Создать недостающие пары _ok/_dam
Normalni teskari (flip)|Flip normal|Перевернуть нормаль
Weld (nuqtalarni birlashtirish + silliq)|Weld (merge vertices + smooth)|Weld (слияние вершин + сглаживание)
Transformni qotirish (Apply)|Apply transform|Применить трансформацию
Yakkalash (faqat tanlangan)|Isolate (selected only)|Изолировать (только выбранное)
O’lchash (2 nuqta)|Measure (2 points)|Измерить (2 точки)
Soya|Shadow|Тень
Avto aylanish|Auto rotate|Автовращение
Animatsiya ▶|Animation ▶|Анимация ▶
Animatsiya ⏸|Animation ⏸|Анимация ⏸
Fon: standart|Background: default|Фон: стандартный
Fon rangi|Background color|Цвет фона
Old|Front|Спереди
O’ng|Right|Справа
Yuqori|Top|Сверху
Edit (Tab)|Edit (Tab)|Правка (Tab)
Ko’p tanlash|Multi-select|Мультивыбор
Hammasi (Ctrl+A)|Select all (Ctrl+A)|Выбрать всё (Ctrl+A)
Ramka|Box select|Рамка
Karkas|Wireframe|Каркас
Panjara|Grid|Сетка
Magnit|Snap|Привязка
Modelni shu yerga tashlang yoki Fayl → Ochish (import).|Drop a model here or use File → Open (import).|Перетащите модель сюда или Файл → Открыть (импорт).
Teksturalar|Textures|Текстуры
Xossalar|Properties|Свойства
Nom|Name|Имя
Rang|Color|Цвет
G’adir-budurlik|Roughness|Шероховатость
Metallik|Metalness|Металличность
Shaffoflik|Opacity|Прозрачность
Joy|Position|Позиция
Burilish|Rotation|Поворот
O’lcham|Scale|Масштаб
Model ochilmagan.|No model loaded.|Модель не открыта.
Mesh tanlang|Select a mesh|Выберите меш
Avval mesh tanlang|Select a mesh first|Сначала выберите меш
Avval Edit mode’dan chiqing|Exit Edit mode first|Сначала выйдите из режима Edit
O’lchash: modelda 2 nuqtani bosing|Measure: click 2 points on the model|Измерение: нажмите 2 точки на модели
O’lchash o’chirildi|Measuring turned off|Измерение выключено
2-nuqtani bosing|Click the 2nd point|Нажмите 2-ю точку
Ko’chirish (G)|Move (G)|Переместить (G)
Aylantirish (R)|Rotate (R)|Повернуть (R)
O’lcham (S)|Scale (S)|Масштаб (S)
Kamera (F)|Camera (F)|Камера (F)
G ko’chirish · R aylantirish · S o’lcham · Shift+D nusxa · X o’chirish · F kamera · Tab edit mode|G move · R rotate · S scale · Shift+D duplicate · X delete · F camera · Tab edit mode|G перемещение · R поворот · S масштаб · Shift+D дубль · X удалить · F камера · Tab режим правки
⚙ Sozlamalar|⚙ Settings|⚙ Настройки
ⓘ Ilova haqida|ⓘ About|ⓘ О приложении
Sozlamalar|Settings|Настройки
Ilova haqida|About|О приложении
Yopish|Close|Закрыть
3D ko’rinish sifati|3D view quality|Качество 3D-вида
Ko’rinish sifatini tanlang|Choose view quality|Выберите качество вида
Tayyor to’plam. Pastdagi “Sifatni alohida sozlash” o’zgarsa, “Maxsus” bo’ladi.|Preset. If you change “Fine-tune quality” below, it becomes “Custom”.|Готовый набор. Если изменить «Тонкую настройку качества» ниже, станет «Особый».
FPS chegarasi|FPS limit|Ограничение FPS
Past FPS batareyani tejaydi.|A lower FPS saves battery.|Низкий FPS экономит батарею.
Cheklovsiz|Unlimited|Без ограничений
Orqa fon rangi|Background color|Цвет фона
Standart fon|Default background|Стандартный фон
Qaytarish|Reset|Сбросить
Past|Low|Низкое
O’rta|Medium|Среднее
@Yuqori|High|Высокое
Maxsus|Custom|Особый
Sifatni alohida sozlash|Fine-tune quality|Тонкая настройка качества
Render o’lchami|Render size|Размер рендера
Kadr piksellari. Kattasi aniqroq, lekin sekinroq. Render (PNG) ham shu o’lchamda.|Frame resolution. Larger is sharper but slower. Render (PNG) uses it too.|Разрешение кадра. Больше — чётче, но медленнее. Рендер (PNG) тоже использует его.
FXAA qirralarni silliqlash|FXAA edge smoothing|Сглаживание краёв FXAA
Qirralardagi “zinapoya”ni yumshatadi.|Softens jagged edges.|Смягчает «лесенку» на краях.
Soyalar aniqligi|Shadow quality|Чёткость теней
Past (512)|Low (512)|Низкая (512)
O’rta (1024)|Medium (1024)|Средняя (1024)
Yuqori (2048)|High (2048)|Высокая (2048)
Ultra (4096)|Ultra (4096)|Ультра (4096)
Soya turi|Shadow type|Тип тени
Yumshoq|Soft|Мягкая
Aniq|Sharp|Чёткая
Qattiq|Hard|Жёсткая
Detallar tiniqligi|Detail sharpness|Резкость деталей
Qiya burchakdagi teksturalar tiniqligi (anizotropiya).|Sharpness of textures at steep angles (anisotropy).|Резкость текстур под острым углом (анизотропия).
O’chiq|Off|Выкл.
Xotirani tejash|Memory saving|Экономия памяти
Render o’lchami ≤ 100%, soya ≤ 1024, anizotropiya o’chiq.|Render size ≤ 100%, shadows ≤ 1024, anisotropy off.|Размер рендера ≤ 100%, тени ≤ 1024, анизотропия выкл.
Yoritish va ko’rinish|Lighting and view|Освещение и вид
Yoritish rejimi|Lighting mode|Режим освещения
Studiya|Studio|Студия
Kun|Daylight|День
Kechqurun|Evening|Вечер
Qattiq|Hard|Жёсткое
Umumiy yorug’lik|Ambient light|Общий свет
Asosiy yorug’lik|Main light|Основной свет
Yorug’lik yo’nalishi|Light direction|Направление света
Yorug’lik balandligi|Light elevation|Высота света
Yorug’lik rangi|Light color|Цвет света
Ranglar ishlovi (tone mapping)|Color processing (tone mapping)|Обработка цвета (tone mapping)
Yo’q|None|Нет
Chiziqli|Linear|Линейная
Ekspozitsiya|Exposure|Экспозиция
Soya qoraligi|Shadow darkness|Тёмность тени
Koordinata o’qlari|Coordinate axes|Оси координат
Kamera va tahrirlash|Camera and editing|Камера и правка
Ko’rish burchagi (FOV)|Field of view (FOV)|Угол обзора (FOV)
Kamera silliq to’xtashi|Smooth camera stop|Плавная остановка камеры
Aylantirish tezligi|Rotation speed|Скорость вращения
Yaqinlashtirish tezligi|Zoom speed|Скорость зума
Siljitish tezligi|Pan speed|Скорость сдвига
Avto aylanish tezligi|Auto-rotate speed|Скорость автовращения
Tutqich (gizmo) o’lchami|Gizmo size|Размер манипулятора (gizmo)
Tutqich koordinatasi|Gizmo space|Система координат манипулятора
Global|Global|Глобальная
Lokal|Local|Локальная
Magnit: siljitish qadami|Snap: move step|Привязка: шаг сдвига
Magnit: burish qadami|Snap: rotation step|Привязка: шаг поворота
Magnit: o’lcham qadami|Snap: scale step|Привязка: шаг масштаба
Bekor qilish tarixi|Undo history|История отмены
Eng ko’p saqlanadigan amallar soni.|Maximum number of stored actions.|Максимальное число сохраняемых действий.
Interfeys va asboblar|Interface and tools|Интерфейс и инструменты
Dastur tili|Language|Язык
Interfeys o’lchami|Interface size|Размер интерфейса
Kichik|Small|Маленький
Oddiy|Normal|Обычный
Katta|Large|Большой
Juda katta|Extra large|Очень большой
Asosiy rang|Accent color|Основной цвет
Chap asboblar paneli|Left tool panel|Левая панель инструментов
Ko’rinish tugmalari (Ortho, Old…)|View buttons (Ortho, Front…)|Кнопки вида (Ortho, Спереди…)
O’ng panel (Outliner, Xossalar)|Right panel (Outliner, Properties)|Правая панель (Outliner, Свойства)
Pastki holat qatori|Bottom status bar|Нижняя строка состояния
O’ng panel kengligi|Right panel width|Ширина правой панели
Klaviatura yorliqlari|Keyboard shortcuts|Горячие клавиши
G ko’chirish · R aylantirish · S o’lcham\\nShift+D nusxa · X o’chirish · F kamera\\nCtrl+Z / Ctrl+Y bekor qilish / qaytarish\\nTab — Edit mode · Ctrl+A hammasi\\nNumpad 1 / 3 / 7 — old / o’ng / yuqori|G move · R rotate · S scale\\nShift+D duplicate · X delete · F camera\\nCtrl+Z / Ctrl+Y undo / redo\\nTab — Edit mode · Ctrl+A select all\\nNumpad 1 / 3 / 7 — front / right / top|G перемещение · R поворот · S масштаб\\nShift+D дубль · X удалить · F камера\\nCtrl+Z / Ctrl+Y отмена / повтор\\nTab — режим Edit · Ctrl+A выбрать всё\\nNumpad 1 / 3 / 7 — спереди / справа / сверху
Fayllar va tiklash|Files and recovery|Файлы и восстановление
Standart eksport formati|Default export format|Формат экспорта по умолчанию
Eksport: maks. tekstura|Export: max texture|Экспорт: макс. текстура
DFF bilan TXD ham eksport|Also export TXD with DFF|Экспортировать TXD вместе с DFF
Eksport: Z-up|Export: Z-up|Экспорт: Z-up
Render (PNG): shaffof fon|Render (PNG): transparent background|Рендер (PNG): прозрачный фон
Sahifadan chiqishda ogohlantirish|Warn before leaving the page|Предупреждать при выходе со страницы
Model ochiq bo’lsa, saqlanmagan o’zgarishlar yo’qolishidan oldin so’raydi.|If a model is open, asks before unsaved changes are lost.|Если модель открыта, спросит перед потерей несохранённых изменений.
Sozlamalarni zaxiralash|Back up settings|Резервная копия настроек
Faylga saqlash (.json)|Save to file (.json)|Сохранить в файл (.json)
Sozlamalarni tiklash|Restore settings|Восстановить настройки
Fayldan yuklash…|Load from file…|Загрузить из файла…
Standart sozlamalarga qaytarish|Reset to defaults|Сбросить к стандартным
Hammasini asliga qaytarish|Reset everything|Сбросить всё
Ilova keshi|App cache|Кэш приложения
Yangilanish ko’rinmasa yordam beradi. Modellar o’chmaydi, lekin ochiq sahna yopiladi.|Helps if an update does not show. Your files are safe, but the open scene is closed.|Помогает, если обновление не отображается. Файлы не удаляются, но открытая сцена закроется.
Keshni tozalash va qayta yuklash|Clear cache and reload|Очистить кэш и перезагрузить
Sozlamalar asliga qaytarildi|Settings were reset|Настройки сброшены
Sozlamalar yuklandi|Settings loaded|Настройки загружены
Sozlamalar fayli yaroqsiz|Invalid settings file|Недопустимый файл настроек
3D Studiya — brauzerda ishlaydigan 3D ko’rish, tahrirlash va konvertatsiya dasturi. Fayllar serverga yuklanmaydi: hammasi qurilmangizning o’zida bajariladi. Ilovani telefon yoki kompyuterga o’rnatib, internetsiz ham ishlatish mumkin.|3D Studiya is a 3D viewer, editor and converter that runs in the browser. Files are not uploaded to a server: everything runs on your own device. You can install the app on a phone or computer and use it offline.|3D Studiya — программа для просмотра, редактирования и конвертации 3D в браузере. Файлы не загружаются на сервер: всё выполняется на вашем устройстве. Приложение можно установить на телефон или компьютер и работать без интернета.
Imkoniyatlar|Features|Возможности
GLB, GLTF, OBJ, FBX, STL, PLY, DAE, 3MF, USD, SKP, STEP va boshqa ko’plab formatlarni ochish va eksport qilish.|Open and export GLB, GLTF, OBJ, FBX, STL, PLY, DAE, 3MF, USD, SKP, STEP and many other formats.|Открытие и экспорт GLB, GLTF, OBJ, FBX, STL, PLY, DAE, 3MF, USD, SKP, STEP и многих других форматов.
GTA modlari uchun: DFF, TXD, YFT, YDR, YTD va RPF fayllari, avto razmer, dummy va _ok/_dam vositalari.|For GTA mods: DFF, TXD, YFT, YDR, YTD and RPF files, auto size, dummy and _ok/_dam tools.|Для модов GTA: файлы DFF, TXD, YFT, YDR, YTD и RPF, авто-размер, дамми и инструменты _ok/_dam.
Tahrirlash: ko’chirish, aylantirish, o’lcham, Edit mode, Boolean, poligon kamaytirish, material presetlari.|Editing: move, rotate, scale, Edit mode, Boolean, polygon reduction, material presets.|Редактирование: перемещение, поворот, масштаб, режим Edit, Boolean, уменьшение полигонов, пресеты материалов.
Soya, o’lchash, animatsiya, X-ray, Render (PNG) va ko’rinish sifati sozlamalari.|Shadows, measuring, animation, X-ray, Render (PNG) and view quality settings.|Тени, измерение, анимация, X-ray, рендер (PNG) и настройки качества вида.
Ilova yaratuvchilari|App creators|Создатели приложения
va|and|и
Manzil|Address|Адрес
Buxoro, O’zbekiston|Bukhara, Uzbekistan|Бухара, Узбекистан
Ijtimoiy tarmoqlar|Social networks|Социальные сети
Sayt — 3d-studiya.vercel.app|Website — 3d-studiya.vercel.app|Сайт — 3d-studiya.vercel.app
Texnologiyalar|Technologies|Технологии
Three.js r147 · OpenCascade (STEP/IGES) · rhino3dm · OpenSKP (MIT) · fflate. Uchinchi tomon litsenziyalari: THIRD_PARTY_LICENSES.md.|Three.js r147 · OpenCascade (STEP/IGES) · rhino3dm · OpenSKP (MIT) · fflate. Third-party licenses: THIRD_PARTY_LICENSES.md.|Three.js r147 · OpenCascade (STEP/IGES) · rhino3dm · OpenSKP (MIT) · fflate. Лицензии сторонних компонентов: THIRD_PARTY_LICENSES.md.
3D Studiya — ko’rish, tahrirlash, konvertatsiya|3D Studiya — view, edit, convert|3D Studiya — просмотр, редактирование, конвертация
`;
const D={en:{},ru:{}};
raw.trim().split('\n').forEach(l=>{const a=l.split('|');if(a.length==3){const k=a[0].replace(/\\n/g,'\n');D.en[k]=a[1].replace(/\\n/g,'\n');D.ru[k]=a[2].replace(/\\n/g,'\n')}});
/* o’zgaruvchan sonli matnlar */
const P=[
 [/^(\d+) ta mesh · (.+) uchburchak$/,'$1 meshes · $2 triangles','$1 мешей · $2 треугольников'],
 [/^Razmer: (.+)$/,'Size: $1','Размер: $1'],
 [/^Masofa: (.+)$/,'Distance: $1','Расстояние: $1'],
 [/^Saqlandi: (.+)$/,'Saved: $1','Сохранено: $1'],
 [/^Saqlash xatosi: (.+)$/,'Save error: $1','Ошибка сохранения: $1'],
 [/^(\d+) ta tekstura yuklandi(.*)$/,'$1 textures loaded$2','Загружено текстур: $1$2'],
 [/^Nuqtalar: (.+)$/,'Vertices: $1','Вершины: $1'],
 [/^(\d+) ta animatsiya topildi.*$/,'$1 animations found — View → Animation','Найдено анимаций: $1 — Вид → Анимация'],
 [/^(\d+) ta LOD nusxa yaratildi.*$/,'$1 LOD copies created (hidden)','Создано копий LOD: $1 (скрыты)'],
 [/^(\d+) ta ko’zgu nusxa: (.+)$/,'$1 mirror copies: $2','Зеркальных копий: $1: $2']
];
let lang='uz';const O=new WeakMap();
function tr(s,opt){if(lang=='uz')return null;const k=s.trim();if(!k)return null;let r=(opt&&D[lang]['@'+k])||D[lang][k];
 if(r==null)for(const p of P)if(p[0].test(k)){r=k.replace(p[0],p[lang=='en'?1:2]);break}
 return r==null?null:s.replace(k,()=>r)}
function fix(n){const t=n.nodeValue,e=O.get(n),op=!!n.parentNode&&n.parentNode.tagName=='OPTION';let src=t;
 if(e&&t===e[1])src=e[0];                       /* t — bizning oldingi natijamiz: asl matn saqlangan */
 const r=lang=='uz'?src:(tr(src,op)??src);
 if(!e&&r===src)return;
 O.set(n,[src,r]);if(r!==t)n.nodeValue=r}
const AT=['title','placeholder','aria-label'];
function fixA(el,a){const t=el.getAttribute(a);if(t==null)return;const m=el.__i||(el.__i={}),e=m[a];let src=t;
 if(e&&t===e[1])src=e[0];
 const r=lang=='uz'?src:(tr(src)??src);
 if(!e&&r===src)return;
 m[a]=[src,r];if(r!==t)el.setAttribute(a,r)}
function walk(root){
 if(root.nodeType==3){fix(root);return}
 if(root.nodeType!=1)return;
 if(root.tagName=='SCRIPT'||root.tagName=='STYLE')return;
 AT.forEach(a=>fixA(root,a));
 const w=document.createTreeWalker(root,5);let n;
 while(n=w.nextNode()){if(n.nodeType==3){if(!/^(SCRIPT|STYLE)$/.test(n.parentNode.tagName))fix(n)}else AT.forEach(a=>fixA(n,a))}}
new MutationObserver(ms=>{if(lang=='uz'){ms.forEach(m=>m.addedNodes.forEach(n=>0));return}
 ms.forEach(m=>{if(m.type=='characterData')fix(m.target);else if(m.type=='attributes')fixA(m.target,m.attributeName);else m.addedNodes.forEach(walk)})
}).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:AT});
const T0=document.title;
window.I18N={set(l){if(!['uz','en','ru'].includes(l))l='uz';lang=l;document.documentElement.lang=l;walk(document.body);
 const t=lang=='uz'?null:D[lang][T0];document.title=t||T0}};
})();
