/**
 * Development logging utility
 * Automatically strips console.logs in production builds
 */

const isDev = import.meta.env.MODE === 'development';

export const devLog = (...args) => {
    if (isDev) {
        console.log(...args);
    }
};

export const devWarn = (...args) => {
    if (isDev) {
        console.warn(...args);
    }
};

export const devError = (...args) => {
    if (isDev) {
        console.error(...args);
    }
};
