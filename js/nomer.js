/* ---- Davlat raqami (nomer) → 3D (v0.0.69) ----
   Istalgan raqam (A123BC, 502GDA, 10 777 AAA …) yoziladi — sifatli 3D nomer sahnaga qo’shiladi.
   Belgi konturlari: Nomer.zip → SVG/*.svg (FE-Schrift XP, balandligi 600 birlik). Plastina 520 × 110 mm, birlik — metr.
   Model: plastina (chekka 0.4 mm qiyalik), hoshiya va belgilar, bayroq (ko’k, oq, yashil + 2 qizil chiziq), «UZ».
   Turlar (TPL): 8 ta uzun (520 × 110 mm) va 8 ta kvadrat (340 × 245 mm) shablon; belgi, bayroq va «UZ» o’lchamlari hamma turda standart.
   Har bir qism alohida mesh. Normallar silliq, faqat o’tkir burchakda (> 35°) qirra qoladi. Old tomon +Z ga qaragan.
   Oldindan ko’rish va 3D bir xil «reja» (plan) dan chiqadi — dialogda ko’ringan narsa aynan yaratiladi. */
(function () {
  'use strict';
  const T = window.THREE;
  if (!T || !T.ShapeUtils) return;

  /* Belgi: [viewBox kengligi, SVG yo’l]. Chap va o’ng bo’sh joy 36 birlikdan. */
  const GLYPHS = {
  "0": [428, "M293 600C346 600 392 558 392 501V115C392 113 392 112 391 112C390 112 388 113 386 115L303 189C299 193 296 198 296 201V487C296 498 291 504 279 504H148C140 504 132 497 132 487V92C132 81 138 76 149 76H291C299 76 307 82 307 92V114C307 123 311 127 319 127C322 127 326 125 331 121L382 75C385 72 387 69 387 65C387 55 358 0 293 0H135C82 0 36 42 36 99V501C36 554 78 600 135 600H293Z"],
  "1": [428, "M375 600C387 600 392 594 392 583V521C392 510 387 504 375 504H313C302 504 296 498 296 487V16C296 5 291 0 279 0H193C188 0 184 1 181 4L78 97C65 109 36 109 36 127V176C36 184 43 192 53 192H101C112 192 113 191 128 176L182 127C187 123 188 121 194 121C198 121 200 122 200 127V487C200 497 192 504 184 504H53C42 504 36 510 36 521V583C36 594 42 600 53 600H375Z"],
  "2": [428, "M375 600C387 600 392 594 392 583V521C392 510 387 504 375 504H171C167 504 165 502 165 497C165 490 169 482 179 472C267 375 392 300 392 132C392 38 312 0 226 0C140 0 60 38 60 132V155C60 166 66 172 77 172H138C153 172 156 160 156 148C156 116 173 96 226 96C278 96 296 117 296 148C296 185 277 243 189 331L121 400C53 468 36 483 36 504V583C36 594 42 600 53 600H375Z"],
  "3": [428, "M392 411C392 384 391 363 389 347C376 256 275 280 275 261C275 259 275 257 277 255L386 133C388 131 392 126 392 114V16C392 5 387 0 375 0H76C68 0 60 6 60 16V59C60 70 66 76 77 76H280C288 76 296 82 296 92C296 102 294 109 290 113L166 245C160 250 156 259 156 268V307C156 315 163 324 172 324H226C290 324 296 343 296 420C296 487 250 504 208 504C144 504 132 478 132 438C132 426 127 420 116 420H53C42 420 36 425 36 437C36 567 117 600 208 600C308 600 392 562 392 411Z"],
  "4": [428, "M331 600C343 600 348 594 348 583V509C348 498 354 492 365 492H375C387 492 392 486 392 475V416C392 408 386 400 375 400H365C356 400 348 392 348 383V297C348 285 343 280 331 280H269C261 280 252 286 252 297V383C252 393 244 400 236 400H149C138 400 132 395 132 385C132 382 133 379 135 376L341 29C344 24 345 20 345 16C345 5 338 0 323 0H271C267 0 257 3 249 16L48 350C38 368 36 392 36 402V475C36 483 43 492 53 492H236C244 492 252 499 252 509V583C252 592 260 600 269 600H331Z"],
  "5": [428, "M392 402C392 226 323 200 250 200C185 200 161 233 141 233C135 233 132 231 132 228V92C132 81 138 76 149 76H375C387 76 392 70 392 59V16C392 5 387 0 375 0H53C42 0 36 5 36 16V295C36 306 42 312 53 312H132C166 312 175 286 218 286C288 286 296 337 296 401C296 480 268 504 199 504C144 504 132 493 132 461C132 452 124 444 115 444H53C42 444 36 449 36 461C36 581 82 600 199 600C313 600 392 560 392 402Z"],
  "6": [428, "M392 401C392 290 365 212 257 212C230 212 203 217 190 221C185 221 183 220 183 217C183 214 183 209 213 160L292 29C295 24 296 20 296 16C296 5 289 0 275 0H219C192 0 36 231 36 401C36 498 101 600 216 600C330 600 392 495 392 401ZM132 401C132 367 140 334 152 310C159 295 206 294 215 294C223 294 268 295 276 310C289 334 296 367 296 401C296 446 280 504 215 504C149 504 132 445 132 401Z"],
  "7": [428, "M196 600C204 600 212 593 212 583V477C212 460 217 442 227 424L347 204C360 180 392 130 392 97V16C392 8 384 0 374 0H53C44 0 36 8 36 16V151C36 162 42 168 53 168H115C126 168 132 162 132 151V112C132 101 138 96 149 96H259C271 96 276 101 276 112C276 121 275 129 272 135L116 424C111 433 108 440 108 477V583C108 594 114 600 125 600H196Z"],
  "8": [428, "M392 405C392 290 324 285 324 260C324 236 368 230 368 146C368 46 331 0 214 0C103 0 60 44 60 150C60 234 104 239 104 264C104 290 36 289 36 405C36 546 107 600 214 600C357 600 392 505 392 405ZM156 150C156 89 179 76 214 76C249 76 272 87 272 146C272 208 249 225 214 225C179 225 156 212 156 150ZM132 405C132 355 148 301 214 301C280 301 296 356 296 405C296 465 273 504 214 504C148 504 132 455 132 405Z"],
  "9": [428, "M186 600C195 600 201 594 208 583L351 367C369 340 392 296 392 200C392 42 321 0 214 0C72 0 36 100 36 200C36 282 60 372 154 372C202 372 235 296 235 292C235 288 233 286 229 286C167 286 132 274 132 200C132 140 153 96 214 96C263 96 296 111 296 200C296 230 290 283 263 322L94 564C89 571 86 578 86 585C86 595 94 600 108 600H186Z"],
  "A": [452, "M99 600C102 600 118 599 119 586L136 498C139 484 143 480 153 480H289C298 480 304 486 306 498L322 586C324 595 332 600 345 600H389C407 600 416 591 416 574C416 570 415 566 414 562L308 24C304 7 292 0 273 0H178C165 0 143 10 139 33L38 562C37 566 36 570 36 574C36 598 53 600 58 600H99ZM158 384V381L209 108C211 100 216 96 222 96C228 96 234 100 235 108L285 381C287 393 279 400 267 400H175C166 400 158 393 158 384Z"],
  "B": [452, "M229 600C346 600 416 536 416 417C416 317 323 292 323 273C323 246 388 232 388 140C388 28 301 0 229 0H53C44 0 36 6 36 16V583C36 592 44 600 53 600H229ZM132 226V92C132 81 138 76 149 76H205C255 76 292 107 292 156C292 214 264 244 208 244H148C139 244 132 235 132 226ZM132 488V330C132 325 135 312 149 312H230C288 312 320 354 320 413C320 466 286 504 233 504H148C140 504 132 496 132 488Z"],
  "C": [452, "M416 416C416 403 413 392 399 392H337C326 392 320 397 320 407C320 464 286 504 226 504C170 504 132 479 132 401V116C132 92 148 76 172 76H278C287 76 296 82 296 92V161C296 172 302 178 313 178H366C373 178 378 174 379 164L392 52V45C392 18 370 0 343 0H138C84 0 36 37 36 102V415C36 563 123 600 226 600C344 600 416 531 416 416Z"],
  "D": [452, "M263 600C350 600 416 542 416 451V145C416 62 363 0 282 0H52C44 0 36 6 36 16V66C36 82 76 81 76 100V491C76 510 36 507 36 524V582C36 591 43 600 53 600H263ZM172 487V92C172 81 178 76 189 76H261C298 76 320 109 320 148V450C320 484 296 504 261 504H189C178 504 172 498 172 487Z"],
  "E": [452, "M400 600C408 600 416 593 416 583V522C416 511 409 504 400 504H149C139 504 132 495 132 486V305C132 293 138 288 149 288H303C315 288 320 282 320 271V229C320 220 314 212 303 212H149C139 212 132 203 132 194V92C132 81 138 76 149 76H375C386 76 392 68 392 60V16C392 3 379 0 374 0H53C42 0 36 5 36 16V583C36 594 42 600 53 600H400Z"],
  "F": [452, "M115 600C126 600 132 594 132 583V401C132 389 138 384 149 384H303C315 384 320 378 320 367V313C320 304 314 296 303 296H148C139 296 132 287 132 278V122C132 95 147 76 172 76H400C409 76 416 68 416 60V16C416 3 403 0 398 0H132C53 0 36 45 36 76V583C36 594 42 600 53 600H115Z"],
  "G": [452, "M315 544C327 544 342 600 362 600H400C408 600 416 593 416 583V293C416 281 411 276 399 276H221C211 276 204 284 204 292V334C204 343 211 352 221 352H303C314 352 320 360 320 368V452C320 498 244 512 218 512C182 512 132 490 132 452V130C132 102 134 76 184 76H278C283 76 296 79 296 92V122C296 131 303 140 313 140H375C386 140 392 131 392 122V76C392 15 339 0 306 0H132C81 0 36 37 36 95V457C36 545 93 608 179 608C276 608 308 544 315 544Z"],
  "H": [452, "M114 600C125 600 132 593 132 584V337C132 325 138 320 149 320H304C313 320 320 328 320 337V583C320 592 327 600 337 600H399C413 600 416 587 416 582V16C416 8 410 0 399 0H338C327 0 320 7 320 16V208C320 216 314 224 303 224H149C139 224 132 215 132 206V16C132 6 124 0 116 0H52C43 0 36 7 36 18V584C36 592 43 600 53 600H114Z"],
  "I": [356, "M304 600C312 600 320 593 320 583V518C320 510 316 505 307 504L231 498C226 498 224 495 224 491V94C224 81 264 74 264 62V16C264 7 256 0 246 0H109C100 0 92 6 92 16V62C92 74 132 80 132 94V491C132 495 130 498 125 498L50 505C41 506 36 510 36 518V583C36 594 42 600 53 600H304Z"],
  "J": [452, "M287 600C391 600 416 519 416 452V16C416 5 411 0 400 0H183C177 0 164 3 164 16V60C164 68 171 76 181 76H303C315 76 320 81 320 92V452C320 486 303 504 269 504H183C149 504 132 487 132 452V412C132 406 129 392 115 392H54C43 392 36 396 36 412V452C36 543 76 600 164 600H287Z"],
  "K": [452, "M106 600C114 600 124 594 124 584V437C124 427 127 418 132 411L164 368C166 365 169 363 172 362C177 362 180 364 183 368L309 584C315 595 323 600 331 600H392C408 600 416 596 416 587C416 582 414 575 408 566L241 272C241 270 239 268 239 265C239 263 239 261 241 259L408 32C414 24 416 18 416 12C416 4 408 0 392 0H349C340 0 335 7 328 13L146 252C146 252 137 260 133 260C127 259 124 256 124 252V16C124 8 118 0 108 0H52C42 0 36 11 36 18V584C36 592 43 600 53 600H106Z"],
  "L": [452, "M368 600C393 600 416 581 416 552V428C416 420 410 412 399 412H338C327 412 320 419 320 428V488C320 496 314 504 303 504H149C139 504 132 495 132 486V16C132 6 124 0 116 0H52C43 0 36 7 36 18V584C36 592 43 600 53 600H368Z"],
  "M": [452, "M106 600C117 600 124 593 124 584V205C124 202 126 200 130 200C133 200 136 202 138 205L207 395C210 403 217 407 226 407C236 407 242 403 245 395L315 205C316 202 319 200 323 200C326 202 328 203 328 205V584C328 593 337 600 346 600H400C409 600 416 592 416 584V18C416 7 409 0 400 0H363C353 0 345 4 341 13L236 259C235 263 231 265 226 265C220 265 217 263 216 259L111 13C107 4 100 0 89 0H52C43 0 36 7 36 18V584C36 592 43 600 53 600H106Z"],
  "N": [452, "M106 600C117 600 124 593 124 584V246C124 242 127 240 133 240C137 240 140 242 142 246L326 570C327 572 328 576 328 583C328 593 336 600 344 600H400C409 600 416 592 416 584V18C416 13 413 0 399 0H344C336 0 328 6 328 16V354C328 358 326 360 320 360C315 360 312 358 310 354L126 29C125 26 124 22 124 16C124 6 116 0 108 0H52C43 0 36 7 36 18V584C36 592 43 600 53 600H106Z"],
  "O": [452, "M416 329C416 202 369 0 225 0C109 0 36 154 36 329C36 488 59 608 225 608C386 608 416 498 416 329ZM132 329C132 280 135 76 225 76C316 76 320 281 320 329C320 418 316 512 225 512C135 512 132 416 132 329Z"],
  "P": [452, "M146 600C157 600 164 593 164 584V409C164 397 170 392 181 392H229C341 392 416 344 416 181C416 95 364 0 262 0H54C49 0 36 3 36 16V60C36 70 42 76 53 76C63 76 68 81 68 92V584C68 592 75 600 85 600H146ZM164 298V92C164 79 177 76 183 76H228C302 76 320 139 320 193C320 251 284 316 228 316H181C171 316 164 307 164 298Z"],
  "Q": [452, "M394 600C408 600 416 594 416 583C416 578 414 571 409 566L359 504C355 498 355 497 355 493C355 487 363 479 363 477C405 425 416 397 416 325V142C416 28 310 0 225 0C144 0 36 28 36 142V425C36 513 106 600 190 600H394ZM132 425V142C132 97 190 76 227 76C268 76 320 100 320 142V423C320 432 318 436 313 437C309 437 306 435 303 431L266 381C258 369 251 364 241 364H203C194 364 181 367 181 381C181 385 183 389 186 393L248 484C250 486 251 489 251 494C250 500 246 504 240 504H182C142 504 132 453 132 425Z"],
  "R": [452, "M114 600C125 600 132 593 132 584V94C132 89 135 76 149 76H272C280 76 288 82 288 92V201C288 221 273 245 249 245H176C163 245 156 252 156 265V323C156 329 158 335 161 341L310 583C318 597 328 600 332 600H394C408 600 416 594 416 583C416 573 410 567 409 566L269 342C265 336 263 330 263 325C263 299 392 267 392 201V52C392 20 374 0 343 0H52C43 0 36 7 36 18V584C36 592 43 600 53 600H114Z"],
  "S": [452, "M416 449C416 273 156 244 156 139C156 88 214 76 243 76C280 76 320 88 320 140C320 148 327 156 337 156H391C405 156 408 143 408 138C408 37 341 0 242 0C161 0 60 30 60 152C60 324 320 353 320 457C320 508 273 516 225 516C200 516 179 513 162 504C112 479 142 436 112 436H52C43 436 36 444 36 454C36 577 106 608 225 608C325 608 416 558 416 449Z"],
  "T": [452, "M252 600C260 600 268 593 268 583V112C268 101 274 96 285 96H399C410 96 416 88 416 80V16C416 7 407 0 398 0H53C42 0 36 5 36 16V79C36 90 42 96 53 96H154C159 96 172 99 172 112V583C172 594 178 600 189 600H252Z"],
  "U": [452, "M323 544C327 544 328 546 328 549V583C328 592 335 600 345 600H399C413 600 416 587 416 582V16C416 8 410 0 399 0H338C327 0 320 7 320 16V394C320 448 284 508 213 508C169 508 132 477 132 431V16C132 6 124 0 116 0H52C43 0 36 7 36 18V434C36 527 79 608 179 608C259 608 314 544 323 544Z"],
  "V": [452, "M240 600C272 600 288 571 293 549L415 26L416 18C416 11 413 0 399 0H351C348 0 340 0 336 13L237 472C235 480 231 484 225 484C217 484 213 480 212 472L125 13C124 4 119 0 109 0H53C44 0 36 8 36 19C36 21 37 22 37 24L133 549C137 570 154 600 187 600H240Z"],
  "W": [452, "M154 600C160 600 166 596 169 586L207 457C209 448 216 444 227 444C237 444 243 448 246 457L280 586C282 595 288 600 296 600H333C342 600 347 595 348 586L416 26C418 13 412 0 399 0H354C345 0 340 8 339 13L295 372C294 376 287 380 282 380C276 380 269 376 268 372L252 252C251 243 247 239 239 239H222C207 239 204 246 203 252L183 372C181 376 174 380 170 380C165 380 155 376 155 372L127 16C127 5 122 0 112 0H51C42 0 36 5 36 26L94 586C95 595 101 600 110 600H154Z"],
  "X": [452, "M97 600C109 600 118 590 120 586L215 378C217 375 220 373 224 373C228 373 231 375 233 378L315 583C321 597 333 600 338 600H402C411 600 416 595 416 586C416 582 415 576 412 570L297 297C295 292 294 288 294 283C294 278 295 273 297 270L406 26C408 21 409 17 409 13C409 4 404 0 393 0H344C332 0 324 11 323 13L242 183C240 187 236 188 231 188C227 188 224 187 222 183L146 13C143 4 135 0 125 0H71C67 0 55 1 55 13C55 16 56 19 57 22L161 276C163 281 164 286 164 289C164 294 163 298 161 302L38 579C37 582 36 584 36 586C36 595 42 600 54 600H97Z"],
  "Y": [452, "M263 600C272 600 277 595 277 586V405C277 399 278 395 280 391L312 328C330 293 349 231 357 206L415 26L416 19C416 7 409 0 399 0H366C347 0 338 12 333 26L241 305C239 311 236 313 231 313C227 313 224 311 222 305L134 26C130 13 116 0 104 0H54C40 0 36 10 36 16C36 20 37 23 38 26L95 206C96 211 118 284 143 328L178 391C180 395 181 400 181 405V586C181 595 185 600 195 600H263Z"],
  "Z": [452, "M403 600C412 600 416 596 416 587V517C416 508 412 504 403 504H159C153 504 150 501 150 496C150 494 150 492 151 490L405 88C406 87 408 81 408 76V13C408 4 404 0 395 0H49C40 0 36 4 36 13V63C36 71 41 76 50 76H286C291 76 294 78 294 84C294 85 293 87 292 89L39 485C39 486 36 492 36 498V586C36 595 40 600 49 600H403Z"]
  };

  const CY = 55;                                    // uzun plastina o’rta chizig’i (SVG koordinatada)
  const TOP = 1.6;                                  // plastina old yuzining balandligi (mm)
  const GS = 0.125, RS = 0.093333;                  // belgi masshtabi: asosiy 75 mm, hudud kodi 56 mm balandlik
  const GH = 600, BEAR = 36;
  const MAXSPAN = 340, TEXT_CX = 287.5;             // belgilar sig’adigan eng katta kenglik va markaz (mm)
  const FLAGS = { nomer: { blue: 0x3B8BD0, green: 0x45A83A }, rasmiy: { blue: 0x0099B5, green: 0x1EB53A } };
  const RED = 0xCE1126;
  const FMT_A = [143.0, 209.0, 260.5, 312.0, 379.0, 434.0];   // L DDD LL  (01 A123BC)  — jismoniy shaxs
  const FMT_B = [138.0, 188.5, 239.0, 318.3, 376.2, 434.1];   // DDD LLL   (01 502GDA)  — yuridik shaxs

  /* ---------- yordamchi geometriya ---------- */
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const area = c => {
    let s = 0;
    for (let i = 0; i < c.length; i++) { const p = c[i], q = c[(i + 1) % c.length]; s += p[0] * q[1] - q[0] * p[1]; }
    return s / 2;
  };
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
  const clean = c => {
    const o = [];
    for (const p of c) if (!o.length || !same(o[o.length - 1], p)) o.push([p[0], p[1]]);
    while (o.length > 1 && same(o[0], o[o.length - 1])) o.pop();
    return o;
  };
  const inside = (p, poly) => {
    let r = false;
    for (let i = 0, n = poly.length; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < a[0] + (p[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1])) r = !r;
    }
    return r;
  };

  /* SVG yo’l (M L H V C Z) → ko’pburchaklar */
  function flatten(d, seg) {
    const tok = d.match(/[A-Za-z]|-?\d*\.?\d+/g), out = [], isL = s => /[A-Za-z]/.test(s);
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cur = null;
    const n = () => parseFloat(tok[i++]);
    while (i < tok.length) {
      if (isL(tok[i])) cmd = tok[i++];
      if (cmd === 'M') { x = n(); y = n(); sx = x; sy = y; cur = [[x, y]]; out.push(cur); cmd = 'L'; }
      else if (cmd === 'L') { x = n(); y = n(); cur.push([x, y]); }
      else if (cmd === 'H') { x = n(); cur.push([x, y]); }
      else if (cmd === 'V') { y = n(); cur.push([x, y]); }
      else if (cmd === 'C') {
        const x1 = n(), y1 = n(), x2 = n(), y2 = n(), x3 = n(), y3 = n();
        for (let k = 1; k <= seg; k++) {
          const t = k / seg, m = 1 - t;
          cur.push([m * m * m * x + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3,
                    m * m * m * y + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3]);
        }
        x = x3; y = y3;
      }
      else if (cmd === 'Z' || cmd === 'z') { x = sx; y = sy; }
      else throw new Error('Nomer: yo’l buyrug’i qo’llanmaydi: ' + cmd);
    }
    return out.map(clean).filter(c => c.length >= 3);
  }

  const rrect = (x, y, w, h, r, seg) => {
    const pts = [], cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of cs) for (let k = 0; k <= seg; k++) {
      const a = a0 + Math.PI / 2 * k / seg; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  };
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

  /* ---------- nomer turlari (shablonlar) ---------- */
  const BODY = { white: 0xFFFFFF, green: 0x68CB99, blue: 0x3B82E0, orange: 0xE3991C };   // lex.uz namunalaridan o’lchangan ranglar
  const BODYNAME = { white: 'plastina_oq', green: 'plastina_yashil', blue: 'plastina_kok', orange: 'plastina_tosariq' };
  const BOXGREEN = 0xC7D678;                  // elektromobil hudud katagi (och zaytun)
  /* grp: uzun | kvadrat; split: qatorlarga bo’lish (bo’sh = bir qator); ex: [hudud, raqam] namuna */
  const TPL = {
    standart:          { grp: 'uzun', n: 'Standart (hudud | raqam | bayroq, UZ)', W: 520, H: 110, body: 'white', fg: 'black', region: true, ex: ['01', 'A123BC'] },
    'standart-yashil': { grp: 'uzun', n: 'Standart, yashil hudud katagi', W: 520, H: 110, body: 'white', fg: 'black', region: true, ex: ['01', '502GDA'] },
    'standart-sariq':  { grp: 'uzun', base: 'standart', n: 'To’q sariq: standart (hudud | raqam | bayroq, UZ)', W: 520, H: 110, body: 'orange', fg: 'black', region: true, ex: ['01', '502GDA'] },
    'bayroq-chap':     { grp: 'uzun', n: 'Bayroq chapda (hududsiz)', W: 520, H: 110, body: 'white', fg: 'black', region: false, ex: ['', 'PAA123'] },
    yashil:            { grp: 'uzun', n: 'Yashil (harf + raqam)', W: 520, H: 110, body: 'green', fg: 'white', region: false, ex: ['', 'CMD1234'] },
    kok:               { grp: 'uzun', n: 'Ko’k (UN)', W: 520, H: 110, body: 'blue', fg: 'white', region: false, ex: ['', 'UN1234'] },
    'yashil-hududli':  { grp: 'uzun', n: 'Yashil, hududli', W: 520, H: 110, body: 'green', fg: 'white', region: true, ex: ['01', 'M123456'] },
    'sariq-hududli':   { grp: 'uzun', n: 'To’q sariq (H), hududli', W: 520, H: 110, body: 'orange', fg: 'black', region: true, ex: ['01', 'H123456'] },
    'hudud-ongda':     { grp: 'uzun', n: 'Hudud o’ngda', W: 520, H: 110, body: 'white', fg: 'black', region: true, ex: ['01', 'T123456'] },
    'kv-ustun':        { grp: 'kvadrat', n: 'Kvadrat: o’ng ustunda hudud, bayroq, UZ', W: 340, H: 245, body: 'white', fg: 'black', region: true, split: 'trail', ex: ['01', '123AB'] },
    'kv-ustun-yashil': { grp: 'kvadrat', n: 'Kvadrat: yashil hudud katagi, bayroq, UZ', W: 340, H: 245, body: 'white', fg: 'black', region: true, split: 'trail', ex: ['01', '123MM'] },
    'kv-katak':        { grp: 'kvadrat', n: 'Kvadrat: pastki o’ngda hudud, bayroq, UZ', W: 340, H: 245, body: 'white', fg: 'black', region: true, split: 'trail', ex: ['01', '0123AB'] },
    'kv-katak-yashil': { grp: 'kvadrat', n: 'Kvadrat: pastki o’ngda yashil hudud, bayroq, UZ', W: 340, H: 245, body: 'white', fg: 'black', region: true, split: 'trail', ex: ['01', 'M123MM'] },
    'kv-ustun-sariq':  { grp: 'kvadrat', base: 'kv-ustun', n: 'Kvadrat: to’q sariq, o’ng ustunda hudud, bayroq, UZ', W: 340, H: 245, body: 'orange', fg: 'black', region: true, split: 'trail', ex: ['01', '123MMM'] },
    'kv-katak-sariq':  { grp: 'kvadrat', base: 'kv-katak', n: 'Kvadrat: to’q sariq, pastki o’ngda hudud, bayroq, UZ', W: 340, H: 245, body: 'orange', fg: 'black', region: true, split: 'trail', ex: ['01', 'M123MM'] },
    'kv-bayroq':       { grp: 'kvadrat', n: 'Kvadrat: pastki o’ngda bayroq (hududsiz)', W: 340, H: 245, body: 'white', fg: 'black', region: false, split: 'lead', ex: ['', 'PAA123'] },
    'kv-sariq':        { grp: 'kvadrat', n: 'Kvadrat: to’q sariq, hududli', W: 340, H: 245, body: 'orange', fg: 'black', region: true, split: 'trail', ex: ['01', '123HH'] },
    'kv-traktor':      { grp: 'kvadrat', n: 'Kvadrat: traktor belgisi, pastki o’ngda hudud, bayroq, UZ', W: 340, H: 245, body: 'white', fg: 'black', region: true, split: 'trail', ex: ['01', '899AA'] },
    'kv-traktor-sariq': { grp: 'kvadrat', n: 'Kvadrat: to’q sariq, traktor belgisi, hudud, bayroq, UZ', W: 340, H: 245, body: 'orange', fg: 'black', region: true, split: 'trail', ex: ['50', '456JT'] },
    'kv-t':            { grp: 'kvadrat', n: 'Kvadrat: pastki o’ngda hudud (bayroqsiz)', W: 340, H: 245, body: 'white', fg: 'black', region: true, split: 'digits', ex: ['01', 'T123456'] },
    'kv-yashil':       { grp: 'kvadrat', n: 'Kvadrat: yashil (CMD)', W: 340, H: 245, body: 'green', fg: 'white', region: false, split: 'lead', ex: ['', 'CMD1234'] }
  };
    for (const k in TPL) TPL[k].id = k;

  /* ikki qatorli turlarda matnni qatorlarga bo’lish */
  function splitLines(t, mode) {
    let top, bot, m;   // trail: pastki qatorda oxirgi 1–2 harf (000MMM → 000M / MM)
    if (mode === 'trail') { m = t.match(/^(.*?)([A-Z]{1,2})$/); top = m ? m[1] : ''; bot = m ? m[2] : ''; if (!top || !bot) throw new Error('Pastki qator uchun oxirida harf kerak (masalan 123AB)'); }
    else if (mode === 'lead') { m = t.match(/^([A-Z]+)(.+)$/); top = m ? m[1] : ''; bot = m ? m[2] : ''; if (!top || !bot) throw new Error('Yuqori qator uchun boshida harf kerak (masalan PAA123)'); }
    else { top = t.replace(/[^0-9]/g, ''); bot = t.replace(/[0-9]/g, ''); if (!top || !bot) throw new Error('Raqam ham, harf ham kerak (masalan T123456)'); }
    if (top.length > 7 || bot.length > 7) throw new Error('Qator juda uzun (ko’pi bilan 7 belgi)');
    return [top, bot];
  }

  /* ---------- kiritishni tekshirish ---------- */
  function parseInput(region, text, tplId) {
    const tpl = TPL[tplId || 'standart'];
    if (!tpl) throw new Error('Nomer turi noma’lum');
    let r = String(region == null ? '' : region).toUpperCase().replace(/[\s-]+/g, '');
    let t = String(text == null ? '' : text).toUpperCase().trim();
    const w = t.split(/[\s-]+/).filter(Boolean);
    if (tpl.region && w.length > 1 && /^\d{2}$/.test(w[0]) && w.slice(1).join('').length >= 3) { r = w[0]; w.shift(); }   // «01 A123BC» bitta maydonda
    t = w.join('');
    if (!tpl.region) r = '';
    if (tpl.region && !r) throw new Error('Hudud kodini yozing (masalan 01)');
    if (r.length > 2) throw new Error('Hudud kodi 1–2 belgi bo’lishi kerak');
    if (!t) throw new Error('Raqamni yozing (masalan A123BC)');
    if (t.length > 9) throw new Error('Raqam juda uzun (ko’pi bilan 9 belgi)');
    for (const c of r + t) if (!GLYPHS[c]) throw new Error('«' + c + '» belgisi yo’q. Faqat lotin harflari (A–Z) va raqamlar (0–9)');
    return { region: r, text: t, lines: tpl.split ? splitLines(t, tpl.split) : null };
  }

  /* ---------- joylashtirish ---------- */
  const isD = c => c >= '0' && c <= '9';
  const place = (ch, cx, s, cy) => ({ ch, s, x: cx - GLYPHS[ch][0] * s / 2, y: (cy == null ? CY + 0.5 : cy) - GH * s / 2 });

  /* bir qator belgi: gh — belgi balandligi (mm), maxW dan sig’masa bir tekis kichrayadi (natijada .f — kichrayish koeffitsienti) */
  function lineLayout(str, cx, cy, gh, maxW, o) {
    o = o || {};
    const s0 = gh / GH, k = s0 / GS, ch = str.split(''), cs = [0];
    const cell = c => GLYPHS[c][0] * s0, ink = c => (GLYPHS[c][0] - 2 * BEAR) * s0;
    for (let i = 1; i < ch.length; i++) {
      const a = ch[i - 1], b = ch[i];
      let p = (cell(a) + cell(b)) / 2;
      if (isD(a) && isD(b)) p -= 2.5 * k;
      else if (isD(a) !== isD(b)) p += (o.gap == null ? 18 : o.gap) * k;
      else if (!isD(a)) p += (o.track || 0) * k;
      cs.push(cs[i - 1] + p);
    }
    const left = cs[0] - ink(ch[0]) / 2, right = cs[cs.length - 1] + ink(ch[ch.length - 1]) / 2;
    const f = Math.min(1, maxW / (right - left)), mid = (left + right) / 2;
    const g = ch.map((c, i) => place(c, cx + (cs[i] - mid) * f, s0 * f, cy));
    g.f = f; return g;
  }
  /* ikki qator bir xil o’lchamda (ikkalasi sig’adigan eng kichik koeffitsient) */
  function twoRows(L, top, bot, o) {
    const f = Math.min(lineLayout(top, L.cx1, L.cy1, L.gh, L.m1, o).f, lineLayout(bot, L.cx2, L.cy2, L.gh, L.m2, o).f);
    return lineLayout(top, L.cx1, L.cy1, L.gh * f, 1e9, o).concat(lineLayout(bot, L.cx2, L.cy2, L.gh * f, 1e9, o));
  }

  function layout(text) {
    const ch = text.split(''), cls = ch.map(c => isD(c) ? 'D' : 'L').join('');
    if (cls === 'LDDDLL') return { fmt: 'jismoniy', glyphs: ch.map((c, i) => place(c, FMT_A[i], GS)) };
    if (cls === 'DDDLLL') return { fmt: 'yuridik', glyphs: ch.map((c, i) => place(c, FMT_B[i], GS)) };
    return { fmt: 'boshqa', glyphs: lineLayout(text, TEXT_CX, CY + 0.5, GS * GH, MAXSPAN) };
  }

  function regionLayout(r, cx, cy) {
    cx = cx == null ? 59.95 : cx;
    const ink = c => GLYPHS[c][0] - 2 * BEAR;
    const cs = r.length === 1 ? [cx] : [cx - 18.75, cx + 18.75];
    const s = Math.min(RS, 33.3 / (r.split('').reduce((a, c) => a + ink(c), 0) / r.length));
    return r.split('').map((c, i) => place(c, cs[i], s, cy));
  }

  /* ---------- bayroq: yarim oy va 12 yulduz (Nomer.zip → ozbekiston-bayrogi.svg dagi o’lchamlar) ---------- */
  function moonStars() {
    const k = 0.152, ox = 467.5, oy = 20.027, P = (x, y) => [ox + x * k, oy + y * k], out = [];
    /* yarim oy: tashqi doira (35,20) R15 ichida, ichki doira (40,20) R15 dan tashqarida */
    const at = Math.atan2(5.2098 - 20, 37.5 - 35), outer = [];
    for (let i = 0; i <= 40; i++) { const a = at - (2 * Math.PI - 2 * Math.abs(at)) * i / 40; outer.push(P(35 + 15 * Math.cos(a), 20 + 15 * Math.sin(a))); }
    const inner = [], bs = Math.atan2(34.7902 - 20, 37.5 - 40), be = Math.atan2(5.2098 - 20, 37.5 - 40) + 2 * Math.PI;
    for (let i = 0; i <= 30; i++) { const a = bs + (be - bs) * i / 30; inner.push(P(40 + 15 * Math.cos(a), 20 + 15 * Math.sin(a))); }
    out.push(clean(outer.concat(inner)));
    const rows = [[8, [68, 80, 92]], [20, [56, 68, 80, 92]], [32, [44, 56, 68, 80, 92]]];
    for (const [cy, xs] of rows) for (const cx of xs) {
      const s = [];
      for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 3 * 0.381966 : 3; s.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a))); }
      out.push(s);
    }
    return out;
  }

  /* «UZ»: U — ikki ustun va yarim halqa (SVG chiziq qalinligi 4.2 yopiq kontur qilingan), Z — ko’pburchak */
  function uzContours() {
    const cx = 476.15, cy = 83.35, ro = 8.65, ri = 4.45, top = 66.6, N = 16, u = [[cx - ro, top]];
    for (let k = 0; k <= N; k++) { const t = Math.PI - Math.PI * k / N; u.push([cx + ro * Math.cos(t), cy + ro * Math.sin(t)]); }
    u.push([cx + ro, top], [cx + ri, top]);
    for (let k = 0; k <= N; k++) { const t = Math.PI * k / N; u.push([cx + ri * Math.cos(t), cy + ri * Math.sin(t)]); }
    u.push([cx - ri, top]);
    const z = [[488.5, 66.6], [505.8, 66.6], [505.8, 70.8], [493.661, 87.8], [505.8, 87.8], [505.8, 92], [488.5, 92], [488.5, 87.8], [500.639, 70.8], [488.5, 70.8]];
    return [clean(u), z];
  }

  /* ---------- reja: nima yaratiladi (SVG koordinatalarida, mm) ---------- */
  const glyphContours = g => flatten(GLYPHS[g.ch][1], 12).map(c => c.map(p => [p[0] * g.s + g.x, p[1] * g.s + g.y]));
  const frame = (W, H) => [rrect(3.6, 3.6, W - 7.2, H - 7.2, 4.4, 10), rrect(6.6, 6.6, W - 13.2, H - 13.2, 1.4, 10)];
  const shade = (n, k) => ((n >> 16 & 255) * k << 16) | ((n >> 8 & 255) * k << 8) | ((n & 255) * k) ;
  const hex = n => '#' + ('000000' + n.toString(16)).slice(-6);

  /* kvadrat plastina o’lchamlari (mm): qator markazlari va belgi balandligi (lex.uz namunalaridan) — hamma kvadrat turda bir xil */
  const SQ = { W: 340, H: 245, cy1: 66, cy2: 180, gh: 90 };

  function plan(opts) {
    const o = opts || {}, tpl = TPL[o.tpl] || TPL.standart, inp = parseInput(o.region, o.text, tpl.id), fl = FLAGS[o.flag] || FLAGS.nomer;
    const W = tpl.W, H = tpl.H, fg = tpl.fg === 'white' ? 'star' : 'black', items = [];
    const it = (id, grp, mat, dz, c, z0) => items.push({ id, grp, mat, z0: z0 == null ? TOP : z0, dz, c });
    const glyphs = (arr, z0) => arr.forEach((g, i) => it('belgi_' + (i + 1) + '_' + g.ch, 'belgilar', fg, 1.0, glyphContours(g), z0));
    const region = (cx, cy, z0) => regionLayout(inp.region, cx, cy).forEach((g, i) => it('hudud_' + (i + 1) + '_' + g.ch, 'hudud_kodi', fg, 1.0, glyphContours(g), z0));
    const ON = TOP + 0.5;                      // katak ustidagi belgilar balandligi
    const xf = (c, fx, fy, fs) => c.map(p => [fx + (p[0] - 467.5) * fs, fy + (p[1] - 19) * fs]);
    /* bayroq (+ «UZ») bloki: (fx, fy) — chap-yuqori burchak, fs — masshtab (1 = standart 38 × 24.4 mm) */
    const flag = (fx, fy, fs, uz) => {
      const R = (x, y, w, h) => rect(fx + (x - 467.5) * fs, fy + (y - 19) * fs, w * fs, h * fs);
      it('bayroq_kok', 'bayroq', 'blue', 0.5, [R(467.5, 19, 38, 8.133)]);
      it('bayroq_qizil_1', 'bayroq', 'red', 0.5, [R(467.5, 27.133, 38, 0.8)]);
      it('bayroq_oq', 'bayroq', 'star', 0.5, [R(467.5, 27.933, 38, 6.534)]);     // o’rta oq yo’l (rangli plastinada ham oq)
      it('bayroq_yashil', 'bayroq', 'green', 0.5, [R(467.5, 35.267, 38, 8.133)]);
      it('bayroq_qizil_2', 'bayroq', 'red', 0.5, [R(467.5, 34.467, 38, 0.8)]);
      it('bayroq_oy_yulduz', 'bayroq', 'star', 0.3, moonStars().map(c => xf(c, fx, fy, fs)), TOP + 0.5);
      if (uz) it('UZ', '', 'blue', 0.5, uzContours().map(c => xf(c, fx, fy, fs)));
    };
    const line = (x, y, w, h) => it('ajratgich_' + (items.length), '', fg, 0.7, [rect(x, y, w, h)]);
    const box = (x, y, w, h) => it('hudud_katak', '', 'boxgreen', 0.5, [rect(x, y, w, h)]);
    /* katak chizig’i: yuqori va chap tomoni (burchagi yumaloq), o’ng/pastki uchlari hoshiya ichiga kiradi */
    const cbox = (x, y, R, t) => {
      const xe = W - 5.6, ye = H - 5.6, N = 8, o = [[xe, y]];
      for (let k = 0; k <= N; k++) { const a = -Math.PI / 2 - Math.PI / 2 * k / N; o.push([x + R + R * Math.cos(a), y + R + R * Math.sin(a)]); }
      o.push([x, ye], [x + t, ye]);
      for (let k = 0; k <= N; k++) { const a = -Math.PI + Math.PI / 2 * k / N; o.push([x + R + (R - t) * Math.cos(a), y + R + (R - t) * Math.sin(a)]); }
      o.push([xe, y + t]);
      it('ajratgich_' + items.length, '', fg, 0.7, [o]);
    };
    const circ = (cx, cy, r) => { const o = []; for (let k = 0; k < 28; k++) { const a = 2 * Math.PI * k / 28; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
    /* traktor belgisi (o’zimiz chizgan oddiy siluet): chap-yuqori burchagi (tx, ty), masshtab 1.2, kengligi ≈ 78, balandligi ≈ 60 mm */
    const tractor = (tx, ty) => {
      const k = 1.2, P = a => a.map(p => [tx + p[0] * k, ty + p[1] * k]), C = (cx, cy, r) => P(circ(cx, cy, r));
      const tp = (id, c) => it('traktor_' + id, 'traktor', fg, 1.0, c);
      tp('kapot', [P([[6, 16], [10, 16], [10, 0], [15, 0], [15, 16], [34, 16], [34, 36], [6, 36]])]);
      tp('kabina', [P([[34, 4], [62, 4], [66, 30], [34, 30]]), P([[39, 9], [57, 9], [59, 24], [39, 24]])]);
      tp('gildirak_orqa', [C(56, 37, 13), C(56, 37, 5)]);
      tp('gildirak_old', [C(17, 40, 9), C(17, 40, 3.5)]);
    };
    it('hoshiya', '', fg, 0.7, frame(W, H));
    const id = tpl.base || tpl.id;

    if (tpl.grp === 'uzun') {
      const L = { gap: 34, track: 0 };
      let tcx = 287.5, tmax = 340, lay = null;
      if (id === 'standart' || id === 'standart-yashil') {
        if (id === 'standart-yashil') box(6.6, 6.6, 98.3, 96.8);
        it('ajratgich', '', fg, 0.7, [rect(104.9, 6.5, 2.7, 97)]);
        region(undefined, undefined, id === 'standart-yashil' ? ON : undefined);
        lay = layout(inp.text);
        glyphs(lay.glyphs);
        flag(467.5, 19, 1, true);
      } else {
        if (id === 'bayroq-chap') { tcx = 335; tmax = 340; L.gap = 30; flag(6.6, 6.6, 96.8 / 24.4, false); }   // bayroq plastinaning butun ichki balandligida
        else if (id === 'yashil' || id === 'kok') { tcx = 260; tmax = 440; L.gap = 40; L.track = 20; }
        else if (id === 'hudud-ongda') {
          it('ajratgich', '', fg, 0.7, [rect(412.4, 6.5, 2.7, 97)]);
          region(460.05); tcx = 209.5; tmax = 360; L.gap = 18;
        } else {     // yashil-hududli, sariq-hududli
          it('ajratgich', '', fg, 0.7, [rect(104.9, 6.5, 2.7, 97)]);
          region(); tcx = 310; tmax = 340; L.gap = 18;
        }
        glyphs(lineLayout(inp.text, tcx, CY + 0.5, GS * GH, tmax, L));
      }
      return fin(lay ? lay.fmt : 'bir');
    }

    /* kvadrat turlar: yuqori/pastki qator */
    const [top, bot] = inp.lines, S = SQ, two = (cx1, m1, cx2, m2, o2) => twoRows({ cx1, cy1: S.cy1, cx2, cy2: S.cy2, gh: S.gh, m1, m2 }, top, bot, o2);
    const BX = 170, BY = 128, T = 2.7;          // pastki o’ng katak: chap va yuqori chiziq o’rni
    if (id === 'kv-ustun' || id === 'kv-ustun-yashil') {
      const green = id === 'kv-ustun-yashil';
      it('ajratgich', '', fg, 0.7, [rect(235.9, 6.5, 2.7, 232)]);
      line(238.6, 107.3, 94.8, 2.7);
      if (green) box(238.6, 6.6, 94.8, 100.7);
      region(286, 57, green ? ON : undefined);
      glyphs(two(121.25, 215, 121.25, 215));
      flag(266.85, 137.5, 1, true);
    } else if (id === 'kv-katak' || id === 'kv-katak-yashil') {
      const green = id === 'kv-katak-yashil';
      cbox(BX, BY, 9, T);
      if (green) it('hudud_katak', '', 'boxgreen', 0.5, [rect(BX + T, BY + T, 258 - BX - T, H - 6.6 - BY - T)]);
      region(215.5, 184.5, green ? ON : undefined);
      glyphs(two(170, 305, 88, 140));
      flag(green ? 277.9 : 274.85, 148, 1, true);
    } else if (id === 'kv-traktor' || id === 'kv-traktor-sariq') {
      cbox(BX, BY, 9, T);
      region(215.5, 184.5);
      tractor(9, 41);
      glyphs(two(214.5, 232, 88, 140));
      flag(274.85, 148, 1, true);
    } else if (id === 'kv-bayroq') {
      cbox(188.65, BY, 9, T);
      glyphs(two(170, 305, 97.6, 165));
      flag(233.9, 166.2, 1.5, false);
    } else if (id === 'kv-t') {
      cbox(208.65, BY, 9, T);
      region(272.4, 184.5);
      glyphs(two(170, 305, 107, 180));
    } else if (id === 'kv-sariq') {
      line(225.65, 6.5, 2.7, 104.2); line(225.65, 108, 107.85, 2.7);
      region(280.875, 57.5);
      glyphs(twoRows({ cx1: 116.1, cy1: 57.5, cx2: 170, cy2: S.cy2, gh: S.gh, m1: 196, m2: 300 }, top, bot));
    } else {       // kv-yashil
      glyphs(two(170, 300, 170, 300, { track: 24, gap: 30 }));
    }
    return fin('iki_' + tpl.split);

    function fin(fmt) {
      const bodyN = BODY[tpl.body];
      return { tpl: tpl.id, W, H, region: inp.region, text: inp.text, fmt, flag: FLAGS[o.flag] ? o.flag : 'nomer', items,
               bodyHex: bodyN, bodyName: BODYNAME[tpl.body], edgeHex: tpl.body === 'white' ? 0xB5B5B5 : shade(bodyN, 0.78),
               colors: { black: '#000000', blue: hex(fl.blue), green: hex(fl.green), red: hex(RED), star: '#ffffff', white: '#ffffff', body: hex(bodyN),
                         edge: hex(tpl.body === 'white' ? 0xB5B5B5 : shade(bodyN, 0.78)), boxgreen: hex(BOXGREEN) } };
    }
  }

  /* ---------- kontur → shakl (tashqi CCW, teshik CW), model koordinata: x o’ngga, y yuqoriga ---------- */
  function makeShapes(contours) {
    const info = contours.map(c => [c, area(c)]), outers = [], holes = [];
    info.forEach(([c], i) => {
      let depth = 0;
      info.forEach(([c2, a2], j) => { if (i !== j && Math.abs(a2) > Math.abs(info[i][1]) && inside(c[0], c2)) depth++; });
      (depth % 2 ? holes : outers).push(c);
    });
    return outers.map(o => {
      o = area(o) > 0 ? o : o.slice().reverse();
      return { o, h: holes.filter(h => inside(h[0], o)).map(h => area(h) < 0 ? h : h.slice().reverse()) };
    });
  }
  const toModel = (c, W, H) => clean(c.map(p => [p[0] - W / 2, H / 2 - p[1]]));
  const orient = c => area(c) > 0 ? c : c.slice().reverse();

  function triangulate(shape) {
    const V = a => a.map(p => new T.Vector2(p[0], p[1])), pts = shape.o.concat(...shape.h);
    const faces = T.ShapeUtils.triangulateShape(V(shape.o), shape.h.map(V)), tris = [];
    let got = 0;
    for (const f of faces) {
      let [a, b, c] = f; const cr = cross(pts[a], pts[b], pts[c]);
      if (cr < 0) { const t = b; b = c; c = t; }
      tris.push([a, b, c]); got += Math.abs(cr) / 2;
    }
    const want = area(shape.o) + shape.h.reduce((s, h) => s + area(h), 0);
    if (Math.abs(want - got) > 1e-6 * Math.max(1, Math.abs(want))) throw new Error('Nomer: uchburchaklash xatosi (yuza ' + want.toFixed(3) + ' ≠ ' + got.toFixed(3) + ')');
    return { pts, tris };
  }

  /* ---------- mesh yig’ish ---------- */
  class Geo {
    constructor() { this.p = []; this.n = []; this.i = []; }
    add(pts, nors, tris) {
      const b = this.p.length / 3;
      for (let k = 0; k < pts.length; k++) { this.p.push(pts[k][0], pts[k][1], pts[k][2]); this.n.push(nors[k][0], nors[k][1], nors[k][2]); }
      for (const t of tris) this.i.push(b + t[0], b + t[1], b + t[2]);
    }
  }
  const vn = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  function cap(g, shape, z, up) {
    const { pts, tris } = triangulate(shape);
    g.add(pts.map(p => [p[0], p[1], z]), pts.map(() => [0, 0, up ? 1 : -1]), up ? tris : tris.map(t => [t[0], t[2], t[1]]));
  }

  /* yon devor: A (pastda) va B (tepada) halqalar, vertekslar soni bir xil. O’tkir burchakda normal bo’linadi */
  function strip(g, A, zA, B, zB) {
    const n = A.length, nq = [];
    for (let i = 0; i < n; i++) {
      const a0 = A[i], a1 = A[(i + 1) % n], b0 = B[i], u = [a1[0] - a0[0], a1[1] - a0[1], 0], v = [b0[0] - a0[0], b0[1] - a0[1], zB - zA];
      nq.push(vn([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]));
    }
    const corner = (i, q) => {
      const a = nq[(i - 1 + n) % n], b = nq[i % n];
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] > 0.82 ? vn([a[0] + b[0], a[1] + b[1], a[2] + b[2]]) : nq[q];
    };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, n0 = corner(i, i), n1 = corner(j, i);
      g.add([[A[i][0], A[i][1], zA], [A[j][0], A[j][1], zA], [B[j][0], B[j][1], zB], [B[i][0], B[i][1], zB]], [n0, n1, n1, n0], [[0, 1, 2], [0, 2, 3]]);
    }
  }

  function feature(shapes, z0, z1) {
    const g = new Geo();
    for (const s of shapes) { cap(g, s, z1, true); for (const c of [s.o].concat(s.h)) strip(g, c, z0, c, z1); }
    return g;
  }

  function bodyGeos(W, H) {
    const rings = [[-0.4, 0.4], [0, 0], [1.2, 0], [TOP, 0.4]].map(([z, k]) => [z, orient(toModel(rrect(0.25 + k, 0.25 + k, W - 0.5 - 2 * k, H - 0.5 - 2 * k, 8 - k, 10), W, H))]);
    const caps = new Geo(), sides = new Geo();
    cap(caps, { o: rings[3][1], h: [] }, TOP, true);
    cap(caps, { o: rings[0][1], h: [] }, -0.4, false);
    for (let k = 0; k < 3; k++) strip(sides, rings[k][1], rings[k][0], rings[k + 1][1], rings[k + 1][0]);
    return [caps, sides];
  }

  function toBuffer(parts, PW, PH) {
    let nv = 0, ni = 0;
    parts.forEach(g => { nv += g.p.length / 3; ni += g.i.length; });
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = new Uint32Array(ni), bg = new T.BufferGeometry();
    let vo = 0, io = 0;
    parts.forEach((g, k) => {
      const n = g.p.length / 3;
      for (let v = 0; v < n; v++) {
        const x = g.p[v * 3], y = g.p[v * 3 + 1], z = g.p[v * 3 + 2];
        P[(vo + v) * 3] = x * 0.001; P[(vo + v) * 3 + 1] = y * 0.001; P[(vo + v) * 3 + 2] = z * 0.001;
        U[(vo + v) * 2] = x / PW + 0.5; U[(vo + v) * 2 + 1] = y / PH + 0.5;
      }
      N.set(g.n, vo * 3);
      for (let j = 0; j < g.i.length; j++) I[io + j] = g.i[j] + vo;
      if (parts.length > 1) bg.addGroup(io, g.i.length, k);
      vo += n; io += g.i.length;
    });
    bg.setAttribute('position', new T.BufferAttribute(P, 3));
    bg.setAttribute('normal', new T.BufferAttribute(N, 3));
    bg.setAttribute('uv', new T.BufferAttribute(U, 2));
    bg.setIndex(new T.BufferAttribute(I, 1));
    bg.computeBoundingBox(); bg.computeBoundingSphere();
    return bg;
  }

  const MATS = { white: ['plastina_oq', 0xFFFFFF, 0.45], edge: ['plastina_chet', 0xB5B5B5, 0.6], black: ['qora', 0x000000, 0.45],
                 red: ['qizil', RED, 0.5], star: ['oq', 0xFFFFFF, 0.5], boxgreen: ['hudud_yashil', BOXGREEN, 0.5] };

  /* 3D nomer: THREE.Group (ichida plastina, hoshiya, ajratgich, hudud_kodi, belgilar, bayroq, UZ) */
  function build(opts) {
    const P = plan(opts), fl = FLAGS[P.flag], cache = {};
    const mat = k => {
      if (cache[k]) return cache[k];
      const d = k === 'blue' ? ['kok', fl.blue, 0.5] : k === 'green' ? ['yashil', fl.green, 0.5]
        : k === 'white' ? [P.bodyName, P.bodyHex, 0.45] : k === 'edge' ? ['plastina_chet', P.edgeHex, 0.6] : MATS[k];
      const m = new T.MeshStandardMaterial({ color: d[1], roughness: d[2], metalness: 0 }); m.name = d[0];
      return (cache[k] = m);
    };
    const root = new T.Group(), subs = {};
    root.name = 'Nomer ' + (P.region ? P.region + ' ' : '') + P.text;
    root.userData.nomer = { tpl: P.tpl, region: P.region, text: P.text, fmt: P.fmt, flag: P.flag };
    const pl = new T.Mesh(toBuffer(bodyGeos(P.W, P.H), P.W, P.H), [mat('white'), mat('edge')]); pl.name = 'plastina'; root.add(pl);
    for (const item of P.items) {
      const shapes = makeShapes(item.c.map(c => toModel(c, P.W, P.H))), m = new T.Mesh(toBuffer([feature(shapes, item.z0, item.z0 + item.dz)], P.W, P.H), mat(item.mat));
      m.name = item.id;
      if (item.grp) {
        if (!subs[item.grp]) { subs[item.grp] = new T.Group(); subs[item.grp].name = item.grp; root.add(subs[item.grp]); }
        subs[item.grp].add(m);
      } else root.add(m);
    }
    root.position.y = (P.H / 2 - 0.25) * 0.001;     // pastki cheti panjarada turadi
    return root;
  }

  /* ---------- oldindan ko’rish (2D, xuddi shu reja) ---------- */
  function drawPreview(cv, P) {
    const x = cv.getContext('2d'), k = cv.width / P.W, PW = P.W, PH = P.H;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    x.setTransform(k, 0, 0, k, 0, 0);
    const rr = (r) => { x.beginPath(); rrect(0.25, 0.25, PW - 0.5, PH - 0.5, 8, 10).forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
    rr(); x.fillStyle = P.colors.body; x.fill(); x.lineWidth = 0.5; x.strokeStyle = P.colors.edge; x.stroke();
    for (const item of P.items) {
      x.beginPath();
      for (const c of item.c) { c.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); }
      x.fillStyle = P.colors[item.mat]; x.fill('evenodd');
    }
  }

  window.NomerPlate = { build, plan, parseInput, layout, regionLayout, lineLayout, GLYPHS, TEMPLATES: TPL, drawPreview, version: '0.0.69' };

  /* ---------- Dialog ---------- */
  if (typeof document === 'undefined' || !document.querySelector || !document.createElement('dialog').showModal) return;

  const GRP = { uzun: 'Uzun nomerlar (520 × 110 mm)', kvadrat: 'Kvadrat nomerlar (340 × 245 mm)' };
  const opts = Object.keys(GRP).map(g => '<optgroup label="' + GRP[g] + '">' + Object.values(TPL).filter(t => t.grp === g).map(t => '<option value="' + t.id + '">' + t.n + '</option>').join('') + '</optgroup>').join('');
  const d = document.createElement('dialog');
  d.id = 'nomerdlg';
  d.style.cssText = 'background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:0;max-width:94vw;width:420px;box-shadow:0 10px 30px #000c';
  d.innerHTML = `<div class="ph" style="display:flex;align-items:center"><b>Davlat raqami (nomer)</b><span class="sp"></span><button type="button" id="nzx" title="Yopish">✕</button></div>
<div style="padding:8px 10px;display:grid;gap:7px;max-height:78vh;overflow:auto">
<canvas id="nzp" width="780" height="165" style="display:block;margin:0 auto;width:100%;background:#2a2d31;border-radius:4px"></canvas>
<label>Nomer turi <select id="nzk" style="width:100%">${opts}</select></label>
<div class="row" style="padding:0">
<label id="nzrl" style="flex:0 0 72px">Hudud<input id="nzr" type="text" value="01" maxlength="2" autocomplete="off" spellcheck="false" style="width:100%"></label>
<label style="flex:1">Raqam<input id="nzt" type="text" value="A123BC" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" style="width:100%"></label>
</div>
<div id="nzm" style="min-height:1.35em;font-size:12px;line-height:1.35;color:var(--mt)"></div>
<div class="row" style="padding:0"><button type="button" id="nza" style="flex:1">Jismoniy shaxs</button><button type="button" id="nzb" style="flex:1">Yuridik shaxs</button></div>
<label>Bayroq ranglari <select id="nzf" style="width:100%"><option value="nomer" selected>Nomerdagidek (tavsiya)</option><option value="rasmiy">Rasmiy davlat bayrog’i</option></select></label>
<div class="row" style="padding:0"><button type="button" id="nzg" class="pri" style="flex:1">Yaratish</button><button type="button" id="nzz" style="flex:1">Yopish</button></div>
<div style="color:var(--mt);font-size:12px;line-height:1.35"><strong>Eslatma:</strong> plastina o’lchami turga bog’liq (uzun 520 × 110 mm, kvadrat 340 × 245 mm), birlik — metr. Qismlar alohida mesh: plastina, hoshiya, belgilar, bayroq, UZ. Eksport: Fayl → GLB, OBJ, DFF + TXD va boshqalar. Raqamni «01 A123BC» ko’rinishida ham yozish mumkin.</div>
</div>`;
  document.body.appendChild(d);
  const Q = s => d.querySelector(s), cv = Q('#nzp'), msg = Q('#nzm'), go = Q('#nzg');
  const FM = { jismoniy: 'Format: jismoniy shaxs (harf + 3 raqam + 2 harf)', yuridik: 'Format: yuridik shaxs (3 raqam + 3 harf)', boshqa: 'Boshqa tartib: belgilar avtomatik joylashtirildi',
    bir: 'Bir qatorli nomer: belgilar avtomatik joylashtiriladi', iki_trail: 'Ikki qatorli: oxirgi 2 harf pastga, qolgani yuqoriga',
    iki_lead: 'Ikki qatorli: boshidagi harflar yuqoriga, qolgani pastga', iki_digits: 'Ikki qatorli: raqamlar yuqoriga, harflar pastga' };
  const readOpts = () => ({ tpl: Q('#nzk').value, region: Q('#nzr').value, text: Q('#nzt').value, flag: Q('#nzf').value });
  const syncTpl = () => { Q('#nzrl').style.display = TPL[Q('#nzk').value].region ? '' : 'none'; };

  function refreshDlg() {
    try {
      const P = plan(readOpts());
      cv.height = Math.round(cv.width * P.H / P.W); cv.style.width = P.W < 400 ? '64%' : '100%';
      cv.style.opacity = 1; drawPreview(cv, P);
      msg.style.color = 'var(--mt)'; msg.textContent = FM[P.fmt]; go.disabled = false;
    } catch (e) {
      cv.style.opacity = 0.35; msg.style.color = '#e5604d'; msg.textContent = e.message || String(e); go.disabled = true;
    }
  }
  const up = el => { const v = el.value.toUpperCase(); if (v !== el.value) { const p = el.selectionStart; el.value = v; try { el.setSelectionRange(p, p); } catch (_) {} } };
  const setTpl = (id, ex) => { Q('#nzk').value = id; syncTpl(); if (ex !== false) { Q('#nzr').value = TPL[id].ex[0] || '01'; Q('#nzt').value = TPL[id].ex[1]; } refreshDlg(); };
  Q('#nzr').oninput = () => { up(Q('#nzr')); refreshDlg(); };
  Q('#nzt').oninput = () => { up(Q('#nzt')); refreshDlg(); };
  Q('#nzf').onchange = refreshDlg;
  Q('#nzk').onchange = () => setTpl(Q('#nzk').value);
  Q('#nza').onclick = () => { setTpl('standart'); Q('#nzt').value = 'A123BC'; refreshDlg(); };
  Q('#nzb').onclick = () => { setTpl('standart'); Q('#nzt').value = '502GDA'; refreshDlg(); };
  Q('#nzx').onclick = Q('#nzz').onclick = () => d.close();
  d.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !go.disabled && /INPUT/.test(e.target.tagName)) go.click(); });

  try {   // oxirgi qiymatlarni eslab qolish
    const s = JSON.parse(localStorage.getItem('nomer.last') || 'null');
    if (s) { if (s.tpl && TPL[s.tpl]) Q('#nzk').value = s.tpl; Q('#nzr').value = s.region || '01'; Q('#nzt').value = s.text || 'A123BC'; if (s.flag) Q('#nzf').value = s.flag; }
  } catch (_) {}
  syncTpl();

  go.onclick = () => {
    try {
      const o = readOpts(), g = build(o);
      add(g); fit(g); d.close();
      try { localStorage.setItem('nomer.last', JSON.stringify(o)); } catch (_) {}
      let tris = 0; g.traverse(m => { if (m.isMesh) tris += m.geometry.index.count / 3; });
      toast('Nomer yaratildi: ' + (g.userData.nomer.region ? g.userData.nomer.region + ' ' : '') + g.userData.nomer.text + ' · ' + Math.round(tris).toLocaleString() + ' uchburchak');
    } catch (e) { console.error(e); toast('Xato: ' + (e.message || e)); }
  };

  const b = document.querySelector('#nomer');
  if (b) b.onclick = () => {
    const m = document.querySelector('details.mn[open]'); if (m) m.removeAttribute('open');
    syncTpl(); refreshDlg(); d.showModal(); Q('#nzt').focus(); Q('#nzt').select();
  };
})();
