// src/rawModule.ts
var modulePromise;
async function getRawModule() {
  if (!modulePromise) {
    modulePromise = loadRawModule().catch((error) => {
      modulePromise = void 0;
      throw error;
    });
  }
  return modulePromise;
}
async function loadRawModule() {
  const moduleUrl = new URL("./wasm/texture2ddecoder.js", import.meta.url);
  const createModule = await import(moduleUrl.href);
  return createModule.default();
}

// src/Texture2DDecoder.ts
var Texture2DDecoder = class {
  /**
   * Decodes BC1 / DXT1 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc1(data, width, height) {
    return (await getRawModule()).decodeBc1(data, width, height);
  }
  /**
   * Decodes BC2 / DXT3 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc2(data, width, height) {
    return (await getRawModule()).decodeBc2(data, width, height);
  }
  /**
   * Decodes BC3 / DXT5 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc3(data, width, height) {
    return (await getRawModule()).decodeBc3(data, width, height);
  }
  /**
   * Decodes BC4 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc4(data, width, height) {
    return (await getRawModule()).decodeBc4(data, width, height);
  }
  /**
   * Decodes BC5 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc5(data, width, height) {
    return (await getRawModule()).decodeBc5(data, width, height);
  }
  /**
   * Decodes BC6 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc6(data, width, height) {
    return (await getRawModule()).decodeBc6(data, width, height);
  }
  /**
   * Decodes BC7 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeBc7(data, width, height) {
    return (await getRawModule()).decodeBc7(data, width, height);
  }
  /**
   * Decodes ATC RGB4 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeAtcRgb4(data, width, height) {
    return (await getRawModule()).decodeAtcRgb4(data, width, height);
  }
  /**
   * Decodes ATC RGBA8 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeAtcRgba8(data, width, height) {
    return (await getRawModule()).decodeAtcRgba8(data, width, height);
  }
  /**
   * Decodes ETC1 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEtc1(data, width, height) {
    return (await getRawModule()).decodeEtc1(data, width, height);
  }
  /**
   * Decodes ETC2 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEtc2(data, width, height) {
    return (await getRawModule()).decodeEtc2(data, width, height);
  }
  /**
   * Decodes ETC2A1 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEtc2a1(data, width, height) {
    return (await getRawModule()).decodeEtc2a1(data, width, height);
  }
  /**
   * Decodes ETC2A8 texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEtc2a8(data, width, height) {
    return (await getRawModule()).decodeEtc2a8(data, width, height);
  }
  /**
   * Decodes EAC R texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEacr(data, width, height) {
    return (await getRawModule()).decodeEacr(data, width, height);
  }
  /**
   * Decodes signed EAC R texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEacrSigned(data, width, height) {
    return (await getRawModule()).decodeEacrSigned(data, width, height);
  }
  /**
   * Decodes EAC RG texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEacrg(data, width, height) {
    return (await getRawModule()).decodeEacrg(data, width, height);
  }
  /**
   * Decodes signed EAC RG texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeEacrgSigned(data, width, height) {
    return (await getRawModule()).decodeEacrgSigned(data, width, height);
  }
  /**
   * Decodes ASTC texture data to raw `BGRA` bytes.
   *
   * @param data Compressed ASTC block data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @param blockWidth ASTC block width.
   * @param blockHeight ASTC block height.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodeAstc(data, width, height, blockWidth, blockHeight) {
    return (await getRawModule()).decodeAstc(data, width, height, blockWidth, blockHeight);
  }
  /**
   * Decodes PVRTC texture data to raw `BGRA` bytes.
   *
   * @param data Compressed texture data.
   * @param width Texture width in pixels.
   * @param height Texture height in pixels.
   * @param is2bpp Whether the texture uses the 2bpp PVRTC variant.
   * @returns Decoded `BGRA` pixel data.
   */
  static async decodePvrtc(data, width, height, is2bpp = false) {
    return (await getRawModule()).decodePvrtc(data, width, height, is2bpp);
  }
  /**
   * Unpacks Crunch-compressed texture payload data.
   *
   * The returned bytes are still compressed texture blocks and usually need to be
   * passed to one of the decode methods afterward.
   *
   * @param data Crunch container data.
   * @param levelIndex Mip level to unpack. Defaults to `0`.
   * @returns Unpacked compressed texture payload.
   */
  static async unpackCrunch(data, levelIndex = 0) {
    return (await getRawModule()).unpackCrunch(data, levelIndex);
  }
  /**
   * Unpacks Unity Crunch-compressed texture payload data.
   *
   * The returned bytes are still compressed texture blocks and usually need to be
   * passed to one of the decode methods afterward.
   *
   * @param data Unity Crunch container data.
   * @param levelIndex Mip level to unpack. Defaults to `0`.
   * @returns Unpacked compressed texture payload.
   */
  static async unpackUnityCrunch(data, levelIndex = 0) {
    return (await getRawModule()).unpackUnityCrunch(data, levelIndex);
  }
};
export {
  Texture2DDecoder
};
