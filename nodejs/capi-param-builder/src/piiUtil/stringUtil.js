/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { looksLikeHashed, strip } = require('./commonUtil');

const US_STATES = {
    alabama: 'al',
    alaska: 'ak',
    arizona: 'az',
    arkansas: 'ar',
    california: 'ca',
    colorado: 'co',
    connecticut: 'ct',
    delaware: 'de',
    florida: 'fl',
    georgia: 'ga',
    hawaii: 'hi',
    idaho: 'id',
    illinois: 'il',
    indiana: 'in',
    iowa: 'ia',
    kansas: 'ks',
    kentucky: 'ky',
    louisiana: 'la',
    maine: 'me',
    maryland: 'md',
    massachusetts: 'ma',
    michigan: 'mi',
    minnesota: 'mn',
    mississippi: 'ms',
    missouri: 'mo',
    montana: 'mt',
    nebraska: 'ne',
    nevada: 'nv',
    newhampshire: 'nh',
    newjersey: 'nj',
    newmexico: 'nm',
    newyork: 'ny',
    northcarolina: 'nc',
    northdakota: 'nd',
    ohio: 'oh',
    oklahoma: 'ok',
    oregon: 'or',
    pennsylvania: 'pa',
    rhodeisland: 'ri',
    southcarolina: 'sc',
    southdakota: 'sd',
    tennessee: 'tn',
    texas: 'tx',
    utah: 'ut',
    vermont: 'vt',
    virginia: 'va',
    washington: 'wa',
    westvirginia: 'wv',
    wisconsin: 'wi',
    wyoming: 'wy',
};

const CA_PROVINCES = {
    ontario: 'on',
    quebec: 'qc',
    britishcolumbia: 'bc',
    alberta: 'ab',
    saskatchewan: 'sk',
    manitoba: 'mb',
    novascotia: 'ns',
    newbrunswick: 'nb',
    princeedwardisland: 'pe',
    newfoundlandandlabrador: 'nl',
    yukon: 'yt',
    northwestterritories: 'nt',
    nunavut: 'nu',
};

const STATE_MAPPINGS = {
    ...CA_PROVINCES,
    ...US_STATES,
};

const COUNTRY_MAPPINGS = {
    unitedstates: 'us',
    usa: 'us',
    ind: 'in',
    afghanistan: 'af',
    alandislands: 'ax',
    albania: 'al',
    algeria: 'dz',
    americansamoa: 'as',
    andorra: 'ad',
    angola: 'ao',
    anguilla: 'ai',
    antarctica: 'aq',
    antiguaandbarbuda: 'ag',
    argentina: 'ar',
    armenia: 'am',
    aruba: 'aw',
    australia: 'au',
    austria: 'at',
    azerbaijan: 'az',
    bahamas: 'bs',
    bahrain: 'bh',
    bangladesh: 'bd',
    barbados: 'bb',
    belarus: 'by',
    belgium: 'be',
    belize: 'bz',
    benin: 'bj',
    bermuda: 'bm',
    bhutan: 'bt',
    boliviaplurinationalstateof: 'bo',
    bolivia: 'bo',
    bonairesinteustatinsandsaba: 'bq',
    bosniaandherzegovina: 'ba',
    botswana: 'bw',
    bouvetisland: 'bv',
    brazil: 'br',
    britishindianoceanterritory: 'io',
    bruneidarussalam: 'bn',
    brunei: 'bn',
    bulgaria: 'bg',
    burkinafaso: 'bf',
    burundi: 'bi',
    cambodia: 'kh',
    cameroon: 'cm',
    canada: 'ca',
    capeverde: 'cv',
    caymanislands: 'ky',
    centralafricanrepublic: 'cf',
    chad: 'td',
    chile: 'cl',
    china: 'cn',
    christmasisland: 'cx',
    cocoskeelingislands: 'cc',
    colombia: 'co',
    comoros: 'km',
    congo: 'cg',
    congothedemocraticrepublicofthe: 'cd',
    democraticrepublicofthecongo: 'cd',
    cookislands: 'ck',
    costarica: 'cr',
    cotedivoire: 'ci',
    ivorycoast: 'ci',
    croatia: 'hr',
    cuba: 'cu',
    curacao: 'cw',
    cyprus: 'cy',
    czechrepublic: 'cz',
    denmark: 'dk',
    djibouti: 'dj',
    dominica: 'dm',
    dominicanrepublic: 'do',
    ecuador: 'ec',
    egypt: 'eg',
    elsalvador: 'sv',
    equatorialguinea: 'gq',
    eritrea: 'er',
    estonia: 'ee',
    ethiopia: 'et',
    falklandislandsmalvinas: 'fk',
    faroeislands: 'fo',
    fiji: 'fj',
    finland: 'fi',
    france: 'fr',
    frenchguiana: 'gf',
    frenchpolynesia: 'pf',
    frenchsouthernterritories: 'tf',
    gabon: 'ga',
    gambia: 'gm',
    georgia: 'ge',
    germany: 'de',
    ghana: 'gh',
    gibraltar: 'gi',
    greece: 'gr',
    greenland: 'gl',
    grenada: 'gd',
    guadeloupe: 'gp',
    guam: 'gu',
    guatemala: 'gt',
    guernsey: 'gg',
    guinea: 'gn',
    guineabissau: 'gw',
    guyana: 'gy',
    haiti: 'ht',
    heardislandandmcdonaldislands: 'hm',
    holyseevaticancitystate: 'va',
    vatican: 'va',
    honduras: 'hn',
    hongkong: 'hk',
    hungary: 'hu',
    iceland: 'is',
    india: 'in',
    indonesia: 'id',
    iranislamicrepublicof: 'ir',
    iran: 'ir',
    iraq: 'iq',
    ireland: 'ie',
    isleofman: 'im',
    israel: 'il',
    italy: 'it',
    jamaica: 'jm',
    japan: 'jp',
    jersey: 'je',
    jordan: 'jo',
    kazakhstan: 'kz',
    kenya: 'ke',
    kiribati: 'ki',
    koreademocraticpeoplesrepublicof: 'kp',
    northkorea: 'kp',
    korearepublicof: 'kr',
    southkorea: 'kr',
    kuwait: 'kw',
    kyrgyzstan: 'kg',
    laopeoplesdemocraticrepublic: 'la',
    laos: 'la',
    latvia: 'lv',
    lebanon: 'lb',
    lesotho: 'ls',
    liberia: 'lr',
    libya: 'ly',
    liechtenstein: 'li',
    lithuania: 'lt',
    luxembourg: 'lu',
    macao: 'mo',
    macedoniatheformeryugoslavrepublicof: 'mk',
    macedonia: 'mk',
    madagascar: 'mg',
    malawi: 'mw',
    malaysia: 'my',
    maldives: 'mv',
    mali: 'ml',
    malta: 'mt',
    marshallislands: 'mh',
    martinique: 'mq',
    mauritania: 'mr',
    mauritius: 'mu',
    mayotte: 'yt',
    mexico: 'mx',
    micronesiafederatedstatesof: 'fm',
    micronesia: 'fm',
    moldovarepublicof: 'md',
    moldova: 'md',
    monaco: 'mc',
    mongolia: 'mn',
    montenegro: 'me',
    montserrat: 'ms',
    morocco: 'ma',
    mozambique: 'mz',
    myanmar: 'mm',
    namibia: 'na',
    nauru: 'nr',
    nepal: 'np',
    netherlands: 'nl',
    newcaledonia: 'nc',
    newzealand: 'nz',
    nicaragua: 'ni',
    niger: 'ne',
    nigeria: 'ng',
    niue: 'nu',
    norfolkisland: 'nf',
    northernmarianaislands: 'mp',
    norway: 'no',
    oman: 'om',
    pakistan: 'pk',
    palau: 'pw',
    palestinestateof: 'ps',
    palestine: 'ps',
    panama: 'pa',
    papuanewguinea: 'pg',
    paraguay: 'py',
    peru: 'pe',
    philippines: 'ph',
    pitcairn: 'pn',
    poland: 'pl',
    portugal: 'pt',
    puertorico: 'pr',
    qatar: 'qa',
    reunion: 're',
    romania: 'ro',
    russianfederation: 'ru',
    russia: 'ru',
    rwanda: 'rw',
    saintbarthelemy: 'bl',
    sainthelenaascensionandtristandacunha: 'sh',
    saintkittsandnevis: 'kn',
    saintlucia: 'lc',
    saintmartinfrenchpart: 'mf',
    saintpierreandmiquelon: 'pm',
    saintvincentandthegrenadines: 'vc',
    samoa: 'ws',
    sanmarino: 'sm',
    saotomeandprincipe: 'st',
    saudiarabia: 'sa',
    senegal: 'sn',
    serbia: 'rs',
    seychelles: 'sc',
    sierraleone: 'sl',
    singapore: 'sg',
    sintmaartenductchpart: 'sx',
    slovakia: 'sk',
    slovenia: 'si',
    solomonislands: 'sb',
    somalia: 'so',
    southafrica: 'za',
    southgeorgiaandthesouthsandwichislands: 'gs',
    southsudan: 'ss',
    spain: 'es',
    srilanka: 'lk',
    sudan: 'sd',
    suriname: 'sr',
    svalbardandjanmayen: 'sj',
    eswatini: 'sz',
    swaziland: 'sz',
    sweden: 'se',
    switzerland: 'ch',
    syrianarabrepublic: 'sy',
    syria: 'sy',
    taiwanprovinceofchina: 'tw',
    taiwan: 'tw',
    tajikistan: 'tj',
    tanzaniaunitedrepublicof: 'tz',
    tanzania: 'tz',
    thailand: 'th',
    timorleste: 'tl',
    easttimor: 'tl',
    togo: 'tg',
    tokelau: 'tk',
    tonga: 'to',
    trinidadandtobago: 'tt',
    tunisia: 'tn',
    turkey: 'tr',
    turkmenistan: 'tm',
    turksandcaicosislands: 'tc',
    tuvalu: 'tv',
    uganda: 'ug',
    ukraine: 'ua',
    unitedarabemirates: 'ae',
    unitedkingdom: 'gb',
    unitedstatesofamerica: 'us',
    unitedstatesminoroutlyingislands: 'um',
    uruguay: 'uy',
    uzbekistan: 'uz',
    vanuatu: 'vu',
    venezuelabolivarianrepublicof: 've',
    venezuela: 've',
    vietnam: 'vn',
    virginislandsbritish: 'vg',
    virginislandsus: 'vi',
    wallisandfutuna: 'wf',
    westernsahara: 'eh',
    yemen: 'ye',
    zambia: 'zm',
    zimbabwe: 'zw',
};

function getNormalizeString(input, params) {
    let result = null;

    if (input != null) {
        if (looksLikeHashed(input) && typeof input === 'string') {
            if (params.rejectHashed !== true) {
                result = input;
            }
        } else {
            let str = String(input);

            if (params.strip != null) {
                str = strip(str, params.strip);
            }

            if (params.lowercase === true) {
                str = str.toLowerCase();
            } else if (params.uppercase === true) {
                str = str.toUpperCase();
            }

            if (params.truncate != null && params.truncate !== 0) {
                str = unicodeSafeTruncate(str, params.truncate);
            }

            if (params.test != null && params.test !== '') {
                result = new RegExp(params.test).test(str) ? str : null;
            } else {
                result = str;
            }
        }
    }
    return result;
}

function getNormalizedName(input) {
    const params = {
        lowercase: true,
        strip: 'whitespace_and_punctuation',
    };

    return getNormalizeString(input, params);
}

function getNormalizedCity(input) {
    const params = {
        lowercase: true,
        strip: 'all_non_latin_alpha_numeric',
        test: '^[a-z]+',
    };

    return getNormalizeString(input, params);
}

function getNormalizedState(input) {
    if (input == null) {
        return null;
    }

    let inputStr = input;

    try {
        inputStr = normalizeTwoLetterAbbreviations(inputStr, STATE_MAPPINGS);
    } catch (err) {
        console.error(
            'Failed to normalizeTwoLetterAbbreviations when calling getNormalizedState: ',
            err
        );
    }

    return getNormalizeString(inputStr, {
        truncate: 2,
        strip: 'all_non_latin_alpha_numeric',
        test: '^[a-z]+',
        lowercase: true,
    });
}

function normalizeTwoLetterAbbreviations(input, mappings) {
    if (looksLikeHashed(input) || typeof input !== 'string') {
        return input;
    }
    let inputStr = input;
    inputStr = inputStr.toLowerCase().trim();
    inputStr = inputStr.replace(/[^a-z]/g, '');
    inputStr = getFromMap(inputStr, mappings);
    switch (inputStr.length) {
        case 0:
            return null;
        case 1:
            return inputStr;
        default:
            return inputStr.substring(0, 2);
    }
}

function getFromMap(input, mappings) {
    // First check if the input is already a state/province abbreviation (2 letters)
    if (input.length === 2) {
        return input;
    }

    // Check if the input is a direct match
    if (mappings[input] != null) {
        return mappings[input];
    }

    // Check if the input contains US state name
    for (const state of Object.keys(mappings)) {
        if (input.includes(state)) {
            const abbreviation = mappings[state];
            return abbreviation;
        }
    }

    // If no match found, return the original input
    return input.toLowerCase();
}

function unicodeSafeTruncate(value, length) {
    return unicodeSafeSubstr(value, 0, length);
}

function unicodeSafeSubstr(value, start, length) {
    if (typeof value !== 'string') {
        return '';
    }
    if (value.length < length && start === 0) {
        return value;
    }

    // Use Array.from instead of arrayFrom dependency
    return Array.from(value)
        .slice(start, start + length)
        .join('');
}

function getNormalizedCountry(input) {
    if (input == null) {
        return null;
    }

    let inputStr = input;

    try {
        inputStr = normalizeTwoLetterAbbreviations(inputStr, COUNTRY_MAPPINGS);
    } catch (err) {
        console.error(
            'Failed to normalizeTwoLetterAbbreviations when calling getNormalizedCountry: ',
            err
        );
    }

    return getNormalizeString(inputStr, {
        truncate: 2,
        strip: 'all_non_latin_alpha_numeric',
        test: '^[a-z]+',
        lowercase: true,
    });
}

function getNormalizedExternalID(input) {
    if (input == null) {
        return null;
    }

    let inputStr = input;

    return getNormalizeString(inputStr, {
        lowercase: true,
        strip: 'whitespace_only',
    });
}

module.exports = {
    getNormalizedName,
    getNormalizedCity,
    getNormalizedState,
    getNormalizedCountry,
    getNormalizedExternalID,
};
