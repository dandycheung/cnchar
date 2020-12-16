import {ICnChar} from 'cnchar/types';
import {Json} from 'cnchar/types/common';
import dict from './dict/radicals.json';
import {RadicalArg, ISetRadical, IRadical} from './types/common';

const radicals = dict as Json<string>;

export const arg: {
    [prop in RadicalArg]: RadicalArg
} = {
    array: 'array'
};

let _cnchar: ICnChar;

export const radical = ((
    input:string | Array<string>,
    ...args: Array<RadicalArg>
): string | Array<string> => {
    if (_cnchar) {
        _cnchar._.checkArgs('radical', args);
    }

    let res = '';
    for (let i = 0; i < input.length; i++) {
        const char = radicals[input[i]];
        if (char) {
            res += char;
        } else {
            res += input[i];
        }
    }
    if (args.indexOf(arg.array) !== -1 || input instanceof Array) {
        return res.split('');
    }
    return res;
}) as IRadical;

export function setCnchar (cnchar: ICnChar): void {
    _cnchar = cnchar;
}

export const setRadical: ISetRadical = (key: string | Json<string>, value?: string): void => {
    _cnchar._.mapJson(key, value, (k, v) => {
        radicals[k] = v;
    });
};