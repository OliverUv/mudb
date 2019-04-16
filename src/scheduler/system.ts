import {
    MuScheduler,
    MuRequestAnimationFrame,
    MuCancelAnimationFrame,
    MuRequestIdleCallback,
    MuCancelIdleCallback,
    MuProcessNextTick,
} from './scheduler';
import { perfNow } from './perf-now';

const root = (typeof self !== 'undefined' ? self : global) || {};
const frameDuration = 1000 / 60;

let rAF:MuRequestAnimationFrame = root['requestAnimationFrame']
    || root['webkitRequestAnimationFrame']
    || root['mozRequestAnimationFrame'];
let cAF:MuCancelAnimationFrame = root['cancelAnimationFrame']
    || root['webkitCancelAnimationFrame']
    || root['mozCancelAnimationFrame']
    || root['webkitCancelRequestAnimationFrame']
    || root['mozCancelRequestAnimationFrame'];

// ported from https://github.com/chrisdickinson/raf/
if (!rAF || !cAF) {
    const queue:{
        handle:number,
        callback:(id:number) => void,
        cancelled:boolean,
    }[] = [];

    let last = 0;
    let id = 0;

    rAF = (callback) => {
        if (queue.length === 0) {
            const now_ = perfNow();
            const next = Math.max(0, frameDuration - (now_ - last));

            last = now_ + next;
            setTimeout(() => {
                const copy = queue.slice(0);
                queue.length = 0;

                for (let i = 0; i < copy.length; ++i) {
                    if (!copy[i].cancelled) {
                        try {
                            copy[i].callback(last);
                        } catch (e) {
                            setTimeout(() => { throw e; }, 0);
                        }
                    }
                }
            }, Math.round(next));
        }

        queue.push({
            handle: ++id,
            callback: callback,
            cancelled: false,
        });

        return id;
    };

    cAF = (handle) => {
        for (let i = 0; i < queue.length; ++i) {
            if (queue[i].handle === handle) {
                queue[i].cancelled = true;
            }
        }
    };
}

let rIC:MuRequestIdleCallback = root['requestIdleCallback'];
let cIC:MuCancelIdleCallback = root['cancelIdleCallback'];

// ported from https://gist.github.com/paullewis/55efe5d6f05434a96c36
if (!rIC || !cIC) {
    rIC = (cb) => setTimeout(() => {
        const start = perfNow();
        cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (perfNow() - start)),
        });
    }, 1);

    cIC = (handle) => clearTimeout(handle);
}

let nextTick:MuProcessNextTick;
if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
    nextTick = process.nextTick;
} else if (typeof setImmediate === 'function') {
    nextTick = (cb) => {
        setImmediate(cb);
    };
} else {
    nextTick = (cb) => {
        setTimeout(cb, 0);
    };
}

export const MuSystemScheduler:MuScheduler = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: rAF,
    cancelAnimationFrame: cAF,
    requestIdleCallback: rIC,
    cancelIdleCallback: cIC,
    nextTick: nextTick,
};
