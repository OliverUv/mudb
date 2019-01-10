import { MuWriteStream, MuReadStream } from '../stream';

import { MuSchema } from './schema';
import { isMuPrimitiveType } from './type';

export interface Dictionary<Schema extends MuSchema<any>> {
    [key:string]:Schema['identity'];
}

export class MuDictionary<ValueSchema extends MuSchema<any>>
        implements MuSchema<Dictionary<ValueSchema>> {
    public readonly muType = 'dictionary';

    public readonly identity:Dictionary<ValueSchema>;
    public readonly muData:ValueSchema;
    public readonly json:object;
    public readonly capacity:number;

    constructor (
        valueSchema:ValueSchema,
        capacity:number,
        identity?:Dictionary<ValueSchema>,
    ) {
        this.muData = valueSchema;
        this.capacity = capacity;
        this.identity = identity || {};
        this.json = {
            type: 'dictionary',
            valueType: this.muData.json,
            identity: JSON.stringify(this.identity),
        };
    }

    public alloc () : Dictionary<ValueSchema> {
        return {};
    }

    public free (dict:Dictionary<ValueSchema>) {
        const valueSchema = this.muData;
        const props = Object.keys(dict);
        for (let i = 0; i < props.length; ++i) {
            valueSchema.free(dict[props[i]]);
        }
    }

    public equal (a:Dictionary<ValueSchema>, b:Dictionary<ValueSchema>) {
        if (a !== Object(a) || b !== Object(b)) {
            return false;
        }

        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);

        if (aKeys.length !== bKeys.length) {
            return false;
        }
        for (let i = bKeys.length - 1; i >= 0; --i) {
            if (!(bKeys[i] in a)) {
                return false;
            }
        }

        const valueSchema = this.muData;
        for (let i = 0; i < bKeys.length; ++i) {
            const k = bKeys[i];
            if (!valueSchema.equal(a[k], b[k])) {
                return false;
            }
        }
        return true;
    }

    public clone (dict:Dictionary<ValueSchema>) : Dictionary<ValueSchema> {
        const copy = {};
        const keys = Object.keys(dict);
        const valueSchema = this.muData;
        for (let i = 0; i < keys.length; ++i) {
            const k = keys[i];
            copy[k] = valueSchema.clone(dict[k]);
        }
        return copy;
    }

    public assign (dst:Dictionary<ValueSchema>, src:Dictionary<ValueSchema>) {
        if (dst === src) {
            return;
        }

        const dKeys = Object.keys(dst);
        const sKeys = Object.keys(src);
        const valueSchema = this.muData;

        for (let i = 0; i < dKeys.length; ++i) {
            const k = dKeys[i];
            if (!(k in src)) {
                valueSchema.free(dst[k]);
                delete dst[k];
            }
        }

        if (isMuPrimitiveType(valueSchema.muType)) {
            for (let i = 0; i < sKeys.length; ++i) {
                const k = sKeys[i];
                dst[k] = src[k];
            }
            return;
        }

        for (let i = 0; i < sKeys.length; ++i) {
            const k = sKeys[i];
            if (k in dst) {
                valueSchema.assign(dst[k], src[k]);
            } else {
                dst[k] = valueSchema.clone(src[k]);
            }
        }
    }

    public diff (
        base:Dictionary<ValueSchema>,
        target:Dictionary<ValueSchema>,
        out:MuWriteStream,
    ) : boolean {
        const targetProps = Object.keys(target);
        if (targetProps.length > this.capacity) {
            throw new RangeError('mudb/schema: dictionary capacity exceeded');
        }

        out.grow(32);

        let numRemove = 0;
        let numPatch = 0;

        // mark the initial offset
        const removeCounterOffset = out.offset;
        const patchCounterOffset = removeCounterOffset + 4;
        out.offset = removeCounterOffset + 8;

        const baseProps = Object.keys(base);
        for (let i = 0; i < baseProps.length; ++i) {
            const prop = baseProps[i];
            if (!(prop in target)) {
                out.grow(4 + 2 * prop.length);
                out.writeString(prop);
                ++numRemove;
            }
        }

        const valueSchema = this.muData;
        for (let i = 0; i < targetProps.length; ++i) {
            const prefixOffset = out.offset;

            const prop = targetProps[i];
            out.grow(4 + 2 * prop.length);
            out.writeString(prop);

            if (prop in base) {
                if (valueSchema.diff(base[prop], target[prop], out)) {
                    ++numPatch;
                } else {
                    out.offset = prefixOffset;
                }
            } else {
                if (!valueSchema.diff(valueSchema.identity, target[prop], out)) {
                    out.buffer.uint8[prefixOffset + 3] |= 0x80;
                }
                ++numPatch;
            }
        }

        if (numPatch > 0 || numRemove > 0) {
            out.writeUint32At(removeCounterOffset, numRemove);
            out.writeUint32At(patchCounterOffset, numPatch);
            return true;
        } else {
            out.offset = removeCounterOffset;
            return false;
        }
    }

    public patch (
        base:Dictionary<ValueSchema>,
        inp:MuReadStream,
    ) : Dictionary<ValueSchema> {
        const result:Dictionary<ValueSchema> = {};
        const valueSchema = this.muData;

        const numRemove = inp.readUint32();
        const numPatch = inp.readUint32();

        const propsToRemove = {};
        for (let i = 0; i < numRemove; ++i) {
            propsToRemove[inp.readString()] = true;
        }

        const props = Object.keys(base);
        for (let i = 0; i < props.length; ++i) {
            const prop = props[i];
            if (propsToRemove[prop]) {
                continue;
            }
            result[prop] = valueSchema.clone(base[prop]);
        }

        for (let i = 0; i < numPatch; ++i) {
            const isIdentity = inp.buffer.uint8[inp.offset + 3] & 0x80;
            inp.buffer.uint8[inp.offset + 3] &= ~0x80;
            const prop = inp.readString();
            if (prop in base) {
                result[prop] = valueSchema.patch(base[prop], inp);
            } else if (isIdentity) {
                result[prop] = valueSchema.clone(valueSchema.identity);
            } else {
                result[prop] = valueSchema.patch(valueSchema.identity, inp);
            }
        }

        return result;
    }

    public toJSON (dict:Dictionary<ValueSchema>) : Dictionary<any> {
        const json = {};
        const keys = Object.keys(dict);

        const valueSchema = this.muData;
        for (let i = 0; i < keys.length; ++i) {
            const k = keys[i];
            json[k] = valueSchema.toJSON(dict[k]);
        }
        return json;
    }

    public fromJSON (json:Dictionary<any>) : Dictionary<ValueSchema> {
        const dict = {};
        const keys = Object.keys(json);

        const valueSchema = this.muData;
        for (let i = 0; i < keys.length; ++i) {
            const k = keys[i];
            dict[k] = valueSchema.fromJSON(json[k]);
        }
        return dict;
    }
}
