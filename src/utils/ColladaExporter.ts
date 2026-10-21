import * as THREE from 'three';

export interface ColladaExporterOptions {
  version?: '1.4.1' | '1.5.0';
  author?: string | null;
  textureDirectory?: string;
  upAxis?: 'X_UP' | 'Y_UP' | 'Z_UP';
  unitName?: string | null;
  unitMeter?: number | null;
}

export interface ColladaExporterResult {
  data: string;
  textures: any[];
}

export class ColladaExporter {
  parse(
    object: THREE.Object3D,
    onDone?: (res: ColladaExporterResult) => void,
    options: ColladaExporterOptions = {}
  ): ColladaExporterResult | null {
    const opts = Object.assign(
      {
        version: '1.4.1',
        author: null,
        textureDirectory: '',
        upAxis: 'Y_UP',
        unitName: null,
        unitMeter: null,
      },
      options
    );

    if (!opts.upAxis.match(/^[XYZ]_UP$/)) {
      console.error('ColladaExporter: Invalid upAxis: valid values are X_UP, Y_UP or Z_UP.');
      return null;
    }

    if (opts.unitName !== null && opts.unitMeter === null) {
      console.error('ColladaExporter: unitMeter needs to be specified if unitName is specified.');
      return null;
    }

    if (opts.unitMeter !== null && opts.unitName === null) {
      console.error('ColladaExporter: unitName needs to be specified if unitMeter is specified.');
      return null;
    }

    if (opts.textureDirectory !== '') {
      opts.textureDirectory = `${opts.textureDirectory}/`.replace(/\\/g, '/').replace(/\/+/g, '/');
    }

    const version = opts.version;
    if (version !== '1.4.1' && version !== '1.5.0') {
      console.warn(`ColladaExporter : Version ${version} not supported for export. Only 1.4.1 and 1.5.0.`);
      return null;
    }

    function format(urdf: string): string {
      const IS_END_TAG = /^<\//;
      const IS_SELF_CLOSING = /(\?>$)|(\/>$)/;
      const HAS_TEXT = /<[^>]+>[^<]*<\/[^<]+>/;
      const pad = (ch: string, num: number): string => (num > 0 ? ch + pad(ch, num - 1) : '');
      let tagnum = 0;
      const matches = urdf.match(/(<[^>]+>[^<]+<\/[^<]+>)|(<[^>]+>)/g);
      if (!matches) return urdf;
      return matches
        .map(tag => {
          if (!HAS_TEXT.test(tag) && !IS_SELF_CLOSING.test(tag) && IS_END_TAG.test(tag)) {
            tagnum--;
          }
          const res = `${pad('  ', tagnum)}${tag}`;
          if (!HAS_TEXT.test(tag) && !IS_SELF_CLOSING.test(tag) && !IS_END_TAG.test(tag)) {
            tagnum++;
          }
          return res;
        })
        .join('\n');
    }

    function base64ToBuffer(str: string): Uint8Array {
      const b = atob(str);
      const buf = new Uint8Array(b.length);
      for (let i = 0, l = buf.length; i < l; i++) {
        buf[i] = b.charCodeAt(i);
      }
      return buf;
    }

    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    function imageToData(image: any, ext: string) {
      canvas = canvas || document.createElement('canvas');
      ctx = ctx || canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx?.drawImage(image, 0, 0);
      const base64data = canvas.toDataURL(`image/${ext}`, 1).replace(/^data:image\/(png|jpg);base64,/, '');
      return base64ToBuffer(base64data);
    }

    const getFuncs = ['getX', 'getY', 'getZ', 'getW'] as const;
    const tempColor = new THREE.Color();
    function attrBufferToArray(attr: any, isColor = false) {
      if (isColor) {
        const arr = new Float32Array(attr.count * 3);
        for (let i = 0, l = attr.count; i < l; i++) {
          tempColor.fromBufferAttribute(attr, i).convertLinearToSRGB();
          arr[3 * i + 0] = tempColor.r;
          arr[3 * i + 1] = tempColor.g;
          arr[3 * i + 2] = tempColor.b;
        }
        return arr;
      } else if (attr.isInterleavedBufferAttribute) {
        const arr = new attr.array.constructor(attr.count * attr.itemSize);
        const size = attr.itemSize;
        for (let i = 0, l = attr.count; i < l; i++) {
          for (let j = 0; j < size; j++) {
            arr[i * size + j] = attr[getFuncs[j]](i);
          }
        }
        return arr;
      } else {
        return attr.array;
      }
    }

    function subArray(arr: any, st: number, ct: number) {
      if (Array.isArray(arr)) return arr.slice(st, st + ct);
      else return new arr.constructor(arr.buffer, st * arr.BYTES_PER_ELEMENT, ct);
    }

    function getAttribute(attr: any, name: string, params: string[], type: string, isColor = false) {
      const array = attrBufferToArray(attr, isColor);
      return (
        `<source id="${name}">` +
        `<float_array id="${name}-array" count="${array.length}">` +
        Array.from(array).join(' ') +
        '</float_array>' +
        '<technique_common>' +
        `<accessor source="#${name}-array" count="${Math.floor(array.length / attr.itemSize)}" stride="${attr.itemSize}">` +
        params.map(n => `<param name="${n}" type="${type}" />`).join('') +
        '</accessor>' +
        '</technique_common>' +
        '</source>'
      );
    }

    let transMat: THREE.Matrix4 | null = null;
    function getTransform(o: THREE.Object3D) {
      o.updateMatrix();
      transMat = transMat || new THREE.Matrix4();
      transMat.copy(o.matrix);
      transMat.transpose();
      return `<matrix>${transMat.toArray().join(' ')}</matrix>`;
    }

    function processGeometry(bufferGeometry: THREE.BufferGeometry) {
      let info = geometryInfo.get(bufferGeometry);
      if (!info) {
        const meshid = `Mesh${libraryGeometries.length + 1}`;
        const indexCount = bufferGeometry.index
          ? bufferGeometry.index.count * (bufferGeometry.index as any).itemSize || bufferGeometry.index.count
          : bufferGeometry.attributes.position.count;
        const groups =
          bufferGeometry.groups != null && bufferGeometry.groups.length !== 0
            ? bufferGeometry.groups
            : [
                {
                  start: 0,
                  count: indexCount,
                  materialIndex: 0,
                },
              ];
        const gname = bufferGeometry.name ? ` name="${bufferGeometry.name}"` : '';
        let gnode = `<geometry id="${meshid}"${gname}><mesh>`;

        const posName = `${meshid}-position`;
        const vertName = `${meshid}-vertices`;
        gnode += getAttribute(bufferGeometry.attributes.position, posName, ['X', 'Y', 'Z'], 'float');
        gnode += `<vertices id="${vertName}"><input semantic="POSITION" source="#${posName}" /></vertices>`;

        let triangleInputs = `<input semantic="VERTEX" source="#${vertName}" offset="0" />`;
        if ('normal' in bufferGeometry.attributes) {
          const normName = `${meshid}-normal`;
          gnode += getAttribute(bufferGeometry.attributes.normal, normName, ['X', 'Y', 'Z'], 'float');
          triangleInputs += `<input semantic="NORMAL" source="#${normName}" offset="0" />`;
        }
        if ('uv' in bufferGeometry.attributes) {
          const uvName = `${meshid}-texcoord`;
          gnode += getAttribute(bufferGeometry.attributes.uv, uvName, ['S', 'T'], 'float');
          triangleInputs += `<input semantic="TEXCOORD" source="#${uvName}" offset="0" set="0" />`;
        }
        if ('uv2' in bufferGeometry.attributes) {
          const uvName = `${meshid}-texcoord2`;
          gnode += getAttribute(bufferGeometry.attributes.uv2, uvName, ['S', 'T'], 'float');
          triangleInputs += `<input semantic="TEXCOORD" source="#${uvName}" offset="0" set="1" />`;
        }
        if ('color' in bufferGeometry.attributes) {
          const colName = `${meshid}-color`;
          gnode += getAttribute(bufferGeometry.attributes.color, colName, ['R', 'G', 'B'], 'float', true);
          triangleInputs += `<input semantic="COLOR" source="#${colName}" offset="0" />`;
        }

        let indexArray: any = null;
        if (bufferGeometry.index) {
          indexArray = attrBufferToArray(bufferGeometry.index);
        } else {
          indexArray = new Array(indexCount);
          for (let i = 0, l = indexArray.length; i < l; i++) indexArray[i] = i;
        }

        for (let i = 0, l = groups.length; i < l; i++) {
          const group = groups[i];
          const subarr = subArray(indexArray, group.start, group.count);
          const polycount = subarr.length / 3;
          gnode += `<triangles material="MESH_MATERIAL_${group.materialIndex}" count="${polycount}">`;
          gnode += triangleInputs;
          gnode += `<p>${Array.from(subarr).join(' ')}</p>`;
          gnode += '</triangles>';
        }

        gnode += '</mesh></geometry>';
        libraryGeometries.push(gnode);
        info = {
          meshid: meshid,
          bufferGeometry: bufferGeometry,
        };
        geometryInfo.set(bufferGeometry, info);
      }
      return info;
    }

    function processTexture(tex: THREE.Texture) {
      let texid = imageMap.get(tex);
      if (texid == null) {
        texid = `image-${libraryImages.length + 1}`;
        const ext = 'png';
        const name = tex.name || texid;
        let imageNode = `<image id="${texid}" name="${name}">`;
        if (version === '1.5.0') {
          imageNode += `<init_from><ref>${opts.textureDirectory}${name}.${ext}</ref></init_from>`;
        } else {
          imageNode += `<init_from>${opts.textureDirectory}${name}.${ext}</init_from>`;
        }
        imageNode += '</image>';
        libraryImages.push(imageNode);
        imageMap.set(tex, texid);
        textures.push({
          directory: opts.textureDirectory,
          name,
          ext,
          data: imageToData(tex.image, ext),
          original: tex,
        });
      }
      return texid;
    }

    function processMaterial(m: any) {
      let matid = materialMap.get(m);
      if (matid == null) {
        matid = `Mat${libraryEffects.length + 1}`;
        let type = 'phong';
        if (m.isMeshLambertMaterial === true) {
          type = 'lambert';
        } else if (m.isMeshBasicMaterial === true) {
          type = 'constant';
        }

        const emissive = m.emissive ? m.emissive.clone() : new THREE.Color(0, 0, 0);
        const diffuse = m.color ? m.color.clone() : new THREE.Color(0, 0, 0);
        const specular = m.specular ? m.specular.clone() : new THREE.Color(1, 1, 1);
        const shininess = m.shininess || 0;
        const reflectivity = m.reflectivity || 0;
        emissive.convertLinearToSRGB();
        specular.convertLinearToSRGB();
        diffuse.convertLinearToSRGB();

        let transparencyNode = '';
        if (m.transparent === true) {
          transparencyNode +=
            '<transparent>' +
            (m.map ? '<texture texture="diffuse-sampler"></texture>' : '<float>1</float>') +
            '</transparent>';
          if (m.opacity < 1) {
            transparencyNode += `<transparency><float>${m.opacity}</float></transparency>`;
          }
        }

        const techniqueNode =
          `<technique sid="common"><${type}>` +
          '<emission>' +
          (m.emissiveMap
            ? '<texture texture="emissive-sampler" texcoord="TEXCOORD" />'
            : `<color sid="emission">${emissive.r} ${emissive.g} ${emissive.b} 1</color>`) +
          '</emission>' +
          (type !== 'constant'
            ? '<diffuse>' +
              (m.map
                ? '<texture texture="diffuse-sampler" texcoord="TEXCOORD" />'
                : `<color sid="diffuse">${diffuse.r} ${diffuse.g} ${diffuse.b} 1</color>`) +
              '</diffuse>'
            : '') +
          (type !== 'constant'
            ? '<bump>' + (m.normalMap ? '<texture texture="bump-sampler" texcoord="TEXCOORD" />' : '') + '</bump>'
            : '') +
          (type === 'phong'
            ? `<specular><color sid="specular">${specular.r} ${specular.g} ${specular.b} 1</color></specular>` +
              '<shininess>' +
              (m.specularMap
                ? '<texture texture="specular-sampler" texcoord="TEXCOORD" />'
                : `<float sid="shininess">${shininess}</float>`) +
              '</shininess>'
            : '') +
          `<reflective><color>${diffuse.r} ${diffuse.g} ${diffuse.b} 1</color></reflective>` +
          `<reflectivity><float>${reflectivity}</float></reflectivity>` +
          transparencyNode +
          `</${type}></technique>`;

        const effectnode =
          `<effect id="${matid}-effect">` +
          '<profile_COMMON>' +
          (m.map
            ? '<newparam sid="diffuse-surface"><surface type="2D">' +
              `<init_from>${processTexture(m.map)}</init_from>` +
              '</surface></newparam>' +
              '<newparam sid="diffuse-sampler"><sampler2D><source>diffuse-surface</source></sampler2D></newparam>'
            : '') +
          (m.specularMap
            ? '<newparam sid="specular-surface"><surface type="2D">' +
              `<init_from>${processTexture(m.specularMap)}</init_from>` +
              '</surface></newparam>' +
              '<newparam sid="specular-sampler"><sampler2D><source>specular-surface</source></sampler2D></newparam>'
            : '') +
          (m.emissiveMap
            ? '<newparam sid="emissive-surface"><surface type="2D">' +
              `<init_from>${processTexture(m.emissiveMap)}</init_from>` +
              '</surface></newparam>' +
              '<newparam sid="emissive-sampler"><sampler2D><source>emissive-surface</source></sampler2D></newparam>'
            : '') +
          (m.normalMap
            ? '<newparam sid="bump-surface"><surface type="2D">' +
              `<init_from>${processTexture(m.normalMap)}</init_from>` +
              '</surface></newparam>' +
              '<newparam sid="bump-sampler"><sampler2D><source>bump-surface</source></sampler2D></newparam>'
            : '') +
          techniqueNode +
          (m.side === THREE.DoubleSide
            ? '<extra><technique profile="THREEJS"><double_sided sid="double_sided" type="int">1</double_sided></technique></extra>'
            : '') +
          '</profile_COMMON>' +
          '</effect>';

        const materialName = m.name ? ` name="${m.name}"` : '';
        const materialNode = `<material id="${matid}"${materialName}><instance_effect url="#${matid}-effect" /></material>`;
        libraryMaterials.push(materialNode);
        libraryEffects.push(effectnode);
        materialMap.set(m, matid);
      }
      return matid;
    }

    function processObject(o: THREE.Object3D) {
      let node = `<node name="${o.name}">`;
      node += getTransform(o);
      if ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry !== null) {
        const geomInfo = processGeometry((o as THREE.Mesh).geometry);
        const meshid = geomInfo.meshid;
        const geometry = geomInfo.bufferGeometry;

        const mat = (o as THREE.Mesh).material || new THREE.MeshBasicMaterial();
        const materials = Array.isArray(mat) ? mat : [mat];
        const matidsArray =
          geometry.groups.length > materials.length
            ? new Array(geometry.groups.length)
            : new Array(materials.length);

        const matids = matidsArray.fill(null).map((_, i) => processMaterial(materials[i % materials.length]));
        node +=
          `<instance_geometry url="#${meshid}">` +
          (matids.length > 0
            ? '<bind_material><technique_common>' +
              matids
                .map(
                  (id, i) =>
                    `<instance_material symbol="MESH_MATERIAL_${i}" target="#${id}" >` +
                    '<bind_vertex_input semantic="TEXCOORD" input_semantic="TEXCOORD" input_set="0" />' +
                    '</instance_material>'
                )
                .join('') +
              '</technique_common></bind_material>'
            : '') +
          '</instance_geometry>';
      }

      o.children.forEach(c => (node += processObject(c)));
      node += '</node>';
      return node;
    }

    const geometryInfo = new WeakMap();
    const materialMap = new WeakMap();
    const imageMap = new WeakMap();
    const textures: any[] = [];
    const libraryImages: string[] = [];
    const libraryGeometries: string[] = [];
    const libraryEffects: string[] = [];
    const libraryMaterials: string[] = [];
    const libraryVisualScenes = processObject(object);
    const specLink =
      version === '1.4.1' ? 'http://www.collada.org/2005/11/COLLADASchema' : 'https://www.khronos.org/collada/';

    let dae =
      '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' +
      `<COLLADA xmlns="${specLink}" version="${version}">` +
      '<asset>' +
      ('<contributor>' +
        '<authoring_tool>three.js Collada Exporter</authoring_tool>' +
        (opts.author !== null ? `<author>${opts.author}</author>` : '') +
        '</contributor>' +
        `<created>${new Date().toISOString()}</created>` +
        `<modified>${new Date().toISOString()}</modified>` +
        (opts.unitName !== null ? `<unit name="${opts.unitName}" meter="${opts.unitMeter}" />` : '') +
        `<up_axis>${opts.upAxis}</up_axis>`) +
      '</asset>';

    dae += `<library_images>${libraryImages.join('')}</library_images>`;
    dae += `<library_effects>${libraryEffects.join('')}</library_effects>`;
    dae += `<library_materials>${libraryMaterials.join('')}</library_materials>`;
    dae += `<library_geometries>${libraryGeometries.join('')}</library_geometries>`;
    dae += `<library_visual_scenes><visual_scene id="Scene" name="scene">${libraryVisualScenes}</visual_scene></library_visual_scenes>`;
    dae += '<scene><instance_visual_scene url="#Scene"/></scene>';
    dae += '</COLLADA>';

    const res: ColladaExporterResult = {
      data: format(dae),
      textures,
    };
    if (typeof onDone === 'function') {
      requestAnimationFrame(() => onDone(res));
    }
    return res;
  }
}
