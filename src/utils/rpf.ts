import { RpfEntry } from '../types';

export interface RpfArchive {
  name: string;
  entries: RpfEntry[];
  getFile: (e: RpfEntry) => Promise<Blob>;
}

export async function parseRpf(f: File | Blob, fileName: string): Promise<RpfArchive> {
  const rd = async (a: number, n: number) => new DataView(await f.slice(a, a + n).arrayBuffer());
  const h = await rd(0, 16);
  if (h.getUint32(0, true) !== 0x52504637) {
    throw new Error('Bu RPF7 emas (GTA V arxivi kerak)');
  }
  const n = h.getUint32(4, true);
  const nl = h.getUint32(8, true);
  const enc = h.getUint32(12, true);
  if (enc !== 0x4e45504f && enc !== 0) {
    throw new Error('Bu RPF shifrlangan (AES/NG). Faqat shifrsiz “OPEN” arxivlar (OpenIV mod) ochiladi');
  }

  const E = await rd(16, n * 16);
  const N = new Uint8Array((await rd(16 + n * 16, nl)).buffer);
  const L: RpfEntry[] = [];

  const nm = (o: number) => {
    let s = '';
    while (N[o]) s += String.fromCharCode(N[o++]);
    return s;
  };
  const b3 = (p: number) => E.getUint8(p) | (E.getUint8(p + 1) << 8) | (E.getUint8(p + 2) << 16);

  const walk = (i: number, pre: string, dep: number) => {
    if (i >= n || dep > 32) return;
    const p = i * 16;
    const name = nm(E.getUint16(p, true));
    if (E.getUint32(p + 4, true) === 0x7fffff00) {
      const a = E.getUint32(p + 8, true);
      const c = E.getUint32(p + 12, true);
      for (let k = 0; k < c; k++) walk(a + k, i ? pre + name + '/' : pre, dep + 1);
    } else {
      const o = b3(p + 5);
      L.push({
        path: pre + name,
        sz: b3(p + 2),
        off: (o & 0x7fffff) * 512,
        res: !!(o & 0x800000),
        a: E.getUint32(p + 8, true),
        b: E.getUint32(p + 12, true),
      });
    }
  };

  walk(0, '', 0);

  const getFile = async (e: RpfEntry): Promise<Blob> => {
    if (e.res) {
      if (e.sz === 0xffffff) throw new Error('Juda katta resurs qo’llanmaydi');
      const hd = new Uint8Array(new Uint32Array([0x37435352, (((e.a >>> 28) & 15) << 4) | ((e.b >>> 28) & 15), e.a, e.b]).buffer);
      return new Blob([hd, f.slice(e.off, e.off + e.sz)]);
    }
    if (e.b) throw new Error('Bu fayl shifrlangan');
    const raw = f.slice(e.off, e.off + (e.sz || e.a));
    if (!e.sz) return raw;
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Brauzer siqilgan faylni ocholmaydi');
    }
    return new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
  };

  return {
    name: fileName,
    entries: L,
    getFile,
  };
}
