import { assert } from "tsafe/assert";

export type HybridStorage = Storage & {
    setItem_persistInSessionStorage: (key: string, value: string) => void;
};

const PREFIX = "hybridStorage.";

export function createHybridStorage(): HybridStorage {
    const arr: {
        key: string;
        value: string;
        isPersisted: boolean;
    }[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key === null) {
            continue;
        }
        if (!key.startsWith(PREFIX)) {
            continue;
        }

        const value = sessionStorage.getItem(key);

        assert(value !== null);

        arr.push({
            key: key.slice(PREFIX.length),
            value,
            isPersisted: true
        });

    }

    const storage = {
        get length() {
            return arr.length;
        },
        clear() {
            for(let i = 0; i < storage.length; i++){
                const key = storage.key(i);
                assert(key !== null);
                storage.removeItem(key);
            }
        },
        getItem(key: string) {
            const item = arr.find(item => item.key === key);
            if( item === undefined){
                return null;
            }
            return item.value;
        },
        key(index: number) {
            return arr[index]?.key ?? null;
        },
        removeItem(key: string) {

            const item = arr.find(item => item.key === key);

            if (item === undefined) {
                return;
            }

            if (item.isPersisted) {
                sessionStorage.removeItem(`${PREFIX}${key}`);
            }

            const index = arr.indexOf(item);

            arr.splice(index, 1);

        },
        setItem(key: string, value: string) {

            const item = arr.find(item => item.key === key);

            if( item !== undefined && item.isPersisted ){
                storage.setItem_persistInSessionStorage(key, value);
                return;
            }

            if (item === undefined) {
                arr.push({
                    key,
                    value,
                    isPersisted: false
                });
                return;
            }

            item.value = value;

        },
        setItem_persistInSessionStorage(key: string, value: string) {

            sessionStorage.setItem(`${PREFIX}${key}`, value);

            const item = arr.find(item => item.key === key);

            if (item === undefined) {
                arr.push({
                    key,
                    value,
                    isPersisted: true
                });
                return;
            }

            item.value = value;

        }
    };

    return storage;
}
