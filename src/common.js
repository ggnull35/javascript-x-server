export class MustImplementError extends Error {
  constructor(cls, method) {
    super(`Subclasses of ${cls} must implement ${method}`);
  }
}

export class MaskedField {
  static fields: Map<string, ?string>;
  static default_type: string = 'UInt32';
  static type_lengths: Map<string, number> = new Map([
    ['UInt8',  1],
    ['UInt16', 2],
    ['UInt32', 4],
    ['Int8',   1],
    ['Int16',  2],
    ['Int32',  4],
  ]);
  _map: Map<string, number> = new Map();

  constructor(vmask: Number, vdata?: EndianBuffer) {
    if (vmask === 0) {
      return;
    }
    var fields = this.constructor.fields;
    var default_type = this.constructor.default_type;
    var type_lengths = this.constructor.type_lengths;
    var i = 0;
    var offset = 0;
    for (let [k, v] of fields) {
      if (vmask & (2 ** i)) {
        let type = v || default_type;
        this.set(k, vdata['read' + type](offset));
        offset += type_lengths.get(type);
      }
      i++;
    }
  }

  [Symbol.iterator]() {
    return this._map[Symbol.iterator]();
  }

  set(key: string, value: number) {
    return this._map.set(key, value);
  }

  get(key: string) {
    return this._map.get(key);
  }

  writeBuffer(buffer: EndianBuffer, offset?: number) {
    var fields = this.constructor.fields;
    var default_type = this.constructor.default_type;
    var type_lengths = this.constructor.type_lengths;
    var vmask = 0;
    for (let [k, v] of this.map) {
      let type = fields.get(k) || default_type;
      buffer['write' + type](v, offset);
      offset += type_lengths.get(type);
    }
  }

  toMap() {
    return this._map;
  }

  toObject() {
    var o = {};
    for (let [k, v] of this) {
      o[k] = v;
    }
    return o;
  }

  static fromMap(map) {
    var mf = new this(0);
    for (let [k, _] of this.fields) {
      if (map.has(k)) {
        mf.set(k, map.get(k));
      }
    }
    return mf;
  }

  static fromObject(o) {
    var mf = new this(0);
    if (o) {
      for (let [k, _] of this.fields) {
        if (o.hasOwnProperty(k)) {
          mf.set(k, o[k]);
        }
      }
    }
    return mf;
  }

  static getFieldNames(vmask: Number): Array<string> {
    var names = [];
    var fields = this.fields;
    var i = 0;
    for (let [k, v] of fields) {
      if (vmask & Math.pow(2, i)) {
        names.push(k);
      }
    }
    return names;
  }
}

export class GCVField extends MaskedField {
  static fields = new Map([
    'function', 'plane_mask', 'foreground' , 'background', 'line_width',
    'line_style', 'cap_style', 'join_style', 'fill_style', 'fill_rule',
    'tile', 'stipple', 'tile_stipple_x_origin', 'tile_stipple_y_origin', 'font',
    'subwindow_mode', 'graphics_exposures', 'clip_x_origin', 'clip_y_origin',
    'clip_mask', 'dash_offset', 'gc_dashes', 'arc_mode'
  ].map((v) => [v]));
}

export class WinVField extends MaskedField {
  static fields = new Map([
    ['background_pixmap',     'UInt32'],
    ['background_pixel',      'UInt32'],
    ['border_pixmap',         'UInt32'],
    ['border_pixel',          'UInt32'],
    ['bit_gravity',           'UInt8' ],
    ['win_gravity',           'UInt8' ],
    ['backing_store',         'UInt8' ],
    ['backing_planes',        'UInt32'],
    ['backing_pixel',         'UInt32'],
    ['override_redirect',     'UInt8' ],
    ['save_under',            'UInt8' ],
    ['event_mask',            'UInt32'],
    ['do_not_propagate_mask', 'UInt32'],
    ['colormap',              'UInt32'],
    ['cursor',                'UInt32'],
  ]);
}

export class WinConfigureField extends MaskedField {
  static fields = new Map(
    ['x', 'y', 'width', 'height', 'border_width', 'sibling', 'stack_mode']
    .map((v) => [v])
  );
}
