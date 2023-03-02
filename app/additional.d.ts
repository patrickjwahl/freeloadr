declare module '*.scss';

declare global {
    interface Window {
        google: any;
        initMap: any;
    }

    interface ParentNode {
        dataset: any;
    }

    var L: any;
}

export {};