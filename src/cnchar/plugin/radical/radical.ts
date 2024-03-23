import {ICnChar} from 'cnchar-types/main';
import {Json} from 'cnchar-types/main/common';
import dict from './dict/radicals.json';
import structDict from './dict/struct.json';
import {ISetRadical, IRadical, IRadicalResult, TStruct} from 'cnchar-types/plugin/radical';
import {findEqualKeyInMap, _warn} from '@common/util';

const radicals = dict as Json<string>;

let _cnchar: ICnChar;

function checkTrad (input: string) {
    if (_cnchar && _cnchar.hasPlugin('trad')) {
        return getSingleRadical(_cnchar.trad.dict?.radical, input);
    } else {
        return null;
    }
}

export function getDict () {
    return {
        radical: dict,
        struct: structDict
    };
}

export const radical = ((
    input:string,
): IRadicalResult[] => {
    const result: IRadicalResult[] = [];
    for (let i = 0; i < input.length; i++) {
        let single = getSingleRadical(radicals, input[i]);
        if (!single.radical) {
            single = checkTrad(input[i]) || single;
        }
        result.push(single);
    }
    return result;
}) as IRadical;

function getSingleRadical (dict:Json, word: string): IRadicalResult {
    for (const radical in dict) {
        const str = dict[radical];

        const index = str.indexOf(word);

        if (index !== -1) {
            const struct = (structDict as Json)[str.substr(index + 1, 1)] as TStruct;
            if (radical === '*') {
                return {
                    radicalCount: parseInt(str.substr(index + 2, 2)),
                    radical: word,
                    struct,
                };
            } else {
                const radicalCount = parseInt(str.substring(0, str.indexOf(':')));
                return {
                    radicalCount,
                    radical,
                    struct,
                };
            }
        }
    }
    return {radicalCount: 0, struct: '' as TStruct, radical: ''};
}

export function setCnchar (cnchar: ICnChar): void {
    _cnchar = cnchar;
}

export const setRadical: ISetRadical = (key: string | Json<IRadicalResult>, value?: IRadicalResult): void => {
    _cnchar._.mapJson(key, value, (k, v: IRadicalResult) => {
        if (k.length > 1) k = k[0];

        if (Object.values(dict).join('').indexOf(k) !== -1) {
            removeWordRadical(k);
        }
        addIntoNewMap(k, v);
    });
};

function addIntoNewMap (word: string, {radical, struct, radicalCount}: IRadicalResult) {
    let structId = findEqualKeyInMap(structDict, struct);
    if (!structId) {
        structId = '*';
        console.warn(`struct [${struct}] not found in ` + JSON.stringify(Object.values(structDict)));
    }
    if (word === radical) {
        radicals['*'] += `${word}${structId || '*'}${radicalCount || 0}`;
    } else {
        if (radicals[radical]) {
            radicals[radical] += `${word}${structId}`;
        } else {
            radicals[radical] = `${radicalCount}:${word}${structId}`;
        }
    }
};

function removeWordRadical (word: string) {
    for (const radical in radicals) {
        if (radicals[radical].indexOf(word) !== -1) {
            radicals[radical] = radicals[radical].replace(new RegExp(`${word}[a-z][0-9]{0,2}`), '');
            return;
        }
    }
}

export function isRadical (radical: string) {
    return !(radical === '*' || !radicals[radical]);
}

export function getRadicalCount (radical: string) {
    if (!isRadical(radical)) return 0;

    return parseInt(radicals[radical][0]);
}

export function radicalToWord (radical: string, trad = false): {
    word: string, struct: TStruct
}[] {
    const result = radicalToWordBase(radical, radicals);
    if (trad) {
        if (_cnchar && _cnchar.hasPlugin('trad')) {
            return result.concat(radicalToWordBase(radical, _cnchar.trad.dict?.radical));
        } else {

        }
    }
    return result;
}

function radicalToWordBase (radical: string, dict: Json<string>) {
    const str = dict[radical];
    if (!str) {
        _warn(`错误的偏旁部首：${radical}`);
        return [];
    }
    let index = str.indexOf(':') + 1, gap = 2;
    if (radical === '*') {
        index = 0;
        gap = 3;
    }
    const result = [];
    for (let i = index; i < str.length; i += gap) {
        if (radical === '*' && gap === 3 && /[0-9]{2}/.test(str.substr(i + 2, 2))) {
            gap = 4;
        }
        result.push({
            word: str[i],
            struct: (structDict as any)[str[i + 1]]
        });
    }
    return result;
}