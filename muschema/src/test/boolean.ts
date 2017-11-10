import test = require('tape');

import { MuBoolean } from '../boolean';
import { MuReadStream, MuWriteStream } from 'mustreams';

test('boolean', (t) => {
    const defaultValue = false;
    let b = new MuBoolean();

    t.equals(b.identity, defaultValue);
    t.equals(b.muType, 'boolean');
    t.equals(b.alloc(), defaultValue);
    t.equals(b.clone(false), false);

    b = new MuBoolean(true);

    t.equals(b.identity, true);
    t.equals(b.muType, 'boolean');
    t.equals(b.alloc(), true);
    t.equals(b.clone(true), true);

    const ws = new MuWriteStream(4);

    t.equals(b.diffBinary(true, true, ws), false);
    t.equals(b.diffBinary(false, false, ws), false);
    t.equals(b.diffBinary(true, false, ws), true);
    t.equals(b.diffBinary(false, true, ws), true);

    const rs = new MuReadStream(ws);

    t.equals(b.patchBinary(true, rs), false);
    t.equals(b.patchBinary(true, rs), true);

    t.end();
});
