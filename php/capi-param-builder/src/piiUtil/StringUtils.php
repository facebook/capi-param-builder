<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

require_once __DIR__ . '/SharedUtils.php';

class StringUtils
{
  // US States
  private static $US_STATES = [
    'alabama' => 'al',
    'alaska' => 'ak',
    'arizona' => 'az',
    'arkansas' => 'ar',
    'california' => 'ca',
    'colorado' => 'co',
    'connecticut' => 'ct',
    'delaware' => 'de',
    'florida' => 'fl',
    'georgia' => 'ga',
    'hawaii' => 'hi',
    'idaho' => 'id',
    'illinois' => 'il',
    'indiana' => 'in',
    'iowa' => 'ia',
    'kansas' => 'ks',
    'kentucky' => 'ky',
    'louisiana' => 'la',
    'maine' => 'me',
    'maryland' => 'md',
    'massachusetts' => 'ma',
    'michigan' => 'mi',
    'minnesota' => 'mn',
    'mississippi' => 'ms',
    'missouri' => 'mo',
    'montana' => 'mt',
    'nebraska' => 'ne',
    'nevada' => 'nv',
    'newhampshire' => 'nh',
    'newjersey' => 'nj',
    'newmexico' => 'nm',
    'newyork' => 'ny',
    'northcarolina' => 'nc',
    'northdakota' => 'nd',
    'ohio' => 'oh',
    'oklahoma' => 'ok',
    'oregon' => 'or',
    'pennsylvania' => 'pa',
    'rhodeisland' => 'ri',
    'southcarolina' => 'sc',
    'southdakota' => 'sd',
    'tennessee' => 'tn',
    'texas' => 'tx',
    'utah' => 'ut',
    'vermont' => 'vt',
    'virginia' => 'va',
    'washington' => 'wa',
    'westvirginia' => 'wv',
    'wisconsin' => 'wi',
    'wyoming' => 'wy',
  ];
  // Canadian Provinces
  private static $CA_PROVINCES = [
    'ontario' => 'on',
    'quebec' => 'qc',
    'britishcolumbia' => 'bc',
    'alberta' => 'ab',
    'saskatchewan' => 'sk',
    'manitoba' => 'mb',
    'novascotia' => 'ns',
    'newbrunswick' => 'nb',
    'princeedwardisland' => 'pe',
    'newfoundlandandlabrador' => 'nl',
    'yukon' => 'yt',
    'northwestterritories' => 'nt',
    'nunavut' => 'nu',
  ];
  // State mappings (US + CA)
  private static $STATE_MAPPINGS = [];

  // Country mappings
  private static $COUNTRY_MAPPINGS = [
    'unitedstates' => 'us',
    'usa' => 'us',
    'ind' => 'in',
    'afghanistan' => 'af',
    'alandislands' => 'ax',
    'albania' => 'al',
    'algeria' => 'dz',
    'americansamoa' => 'as',
    'andorra' => 'ad',
    'angola' => 'ao',
    'anguilla' => 'ai',
    'antarctica' => 'aq',
    'antiguaandbarbuda' => 'ag',
    'argentina' => 'ar',
    'armenia' => 'am',
    'aruba' => 'aw',
    'australia' => 'au',
    'austria' => 'at',
    'azerbaijan' => 'az',
    'bahamas' => 'bs',
    'bahrain' => 'bh',
    'bangladesh' => 'bd',
    'barbados' => 'bb',
    'belarus' => 'by',
    'belgium' => 'be',
    'belize' => 'bz',
    'benin' => 'bj',
    'bermuda' => 'bm',
    'bhutan' => 'bt',
    'boliviaplurinationalstateof' => 'bo',
    'bolivia' => 'bo',
    'bonairesinteustatinsandsaba' => 'bq',
    'bosniaandherzegovina' => 'ba',
    'botswana' => 'bw',
    'bouvetisland' => 'bv',
    'brazil' => 'br',
    'britishindianoceanterritory' => 'io',
    'bruneidarussalam' => 'bn',
    'brunei' => 'bn',
    'bulgaria' => 'bg',
    'burkinafaso' => 'bf',
    'burundi' => 'bi',
    'cambodia' => 'kh',
    'cameroon' => 'cm',
    'canada' => 'ca',
    'capeverde' => 'cv',
    'caymanislands' => 'ky',
    'centralafricanrepublic' => 'cf',
    'chad' => 'td',
    'chile' => 'cl',
    'china' => 'cn',
    'christmasisland' => 'cx',
    'cocoskeelingislands' => 'cc',
    'colombia' => 'co',
    'comoros' => 'km',
    'congo' => 'cg',
    'congothedemocraticrepublicofthe' => 'cd',
    'democraticrepublicofthecongo' => 'cd',
    'cookislands' => 'ck',
    'costarica' => 'cr',
    'cotedivoire' => 'ci',
    'ivorycoast' => 'ci',
    'croatia' => 'hr',
    'cuba' => 'cu',
    'curacao' => 'cw',
    'cyprus' => 'cy',
    'czechrepublic' => 'cz',
    'denmark' => 'dk',
    'djibouti' => 'dj',
    'dominica' => 'dm',
    'dominicanrepublic' => 'do',
    'ecuador' => 'ec',
    'egypt' => 'eg',
    'elsalvador' => 'sv',
    'equatorialguinea' => 'gq',
    'eritrea' => 'er',
    'estonia' => 'ee',
    'ethiopia' => 'et',
    'falklandislandsmalvinas' => 'fk',
    'faroeislands' => 'fo',
    'fiji' => 'fj',
    'finland' => 'fi',
    'france' => 'fr',
    'frenchguiana' => 'gf',
    'frenchpolynesia' => 'pf',
    'frenchsouthernterritories' => 'tf',
    'gabon' => 'ga',
    'gambia' => 'gm',
    'georgia' => 'ge',
    'germany' => 'de',
    'ghana' => 'gh',
    'gibraltar' => 'gi',
    'greece' => 'gr',
    'greenland' => 'gl',
    'grenada' => 'gd',
    'guadeloupe' => 'gp',
    'guam' => 'gu',
    'guatemala' => 'gt',
    'guernsey' => 'gg',
    'guinea' => 'gn',
    'guineabissau' => 'gw',
    'guyana' => 'gy',
    'haiti' => 'ht',
    'heardislandandmcdonaldislands' => 'hm',
    'holyseevaticancitystate' => 'va',
    'vatican' => 'va',
    'honduras' => 'hn',
    'hongkong' => 'hk',
    'hungary' => 'hu',
    'iceland' => 'is',
    'india' => 'in',
    'indonesia' => 'id',
    'iranislamicrepublicof' => 'ir',
    'iran' => 'ir',
    'iraq' => 'iq',
    'ireland' => 'ie',
    'isleofman' => 'im',
    'israel' => 'il',
    'italy' => 'it',
    'jamaica' => 'jm',
    'japan' => 'jp',
    'jersey' => 'je',
    'jordan' => 'jo',
    'kazakhstan' => 'kz',
    'kenya' => 'ke',
    'kiribati' => 'ki',
    'koreademocraticpeoplesrepublicof' => 'kp',
    'northkorea' => 'kp',
    'korearepublicof' => 'kr',
    'southkorea' => 'kr',
    'kuwait' => 'kw',
    'kyrgyzstan' => 'kg',
    'laopeoplesdemocraticrepublic' => 'la',
    'laos' => 'la',
    'latvia' => 'lv',
    'lebanon' => 'lb',
    'lesotho' => 'ls',
    'liberia' => 'lr',
    'libya' => 'ly',
    'liechtenstein' => 'li',
    'lithuania' => 'lt',
    'luxembourg' => 'lu',
    'macao' => 'mo',
    'macedoniatheformeryugoslavrepublicof' => 'mk',
    'macedonia' => 'mk',
    'madagascar' => 'mg',
    'malawi' => 'mw',
    'malaysia' => 'my',
    'maldives' => 'mv',
    'mali' => 'ml',
    'malta' => 'mt',
    'marshallislands' => 'mh',
    'martinique' => 'mq',
    'mauritania' => 'mr',
    'mauritius' => 'mu',
    'mayotte' => 'yt',
    'mexico' => 'mx',
    'micronesiafederatedstatesof' => 'fm',
    'micronesia' => 'fm',
    'moldovarepublicof' => 'md',
    'moldova' => 'md',
    'monaco' => 'mc',
    'mongolia' => 'mn',
    'montenegro' => 'me',
    'montserrat' => 'ms',
    'morocco' => 'ma',
    'mozambique' => 'mz',
    'myanmar' => 'mm',
    'namibia' => 'na',
    'nauru' => 'nr',
    'nepal' => 'np',
    'netherlands' => 'nl',
    'newcaledonia' => 'nc',
    'newzealand' => 'nz',
    'nicaragua' => 'ni',
    'niger' => 'ne',
    'nigeria' => 'ng',
    'niue' => 'nu',
    'norfolkisland' => 'nf',
    'northernmarianaislands' => 'mp',
    'norway' => 'no',
    'oman' => 'om',
    'pakistan' => 'pk',
    'palau' => 'pw',
    'palestinestateof' => 'ps',
    'palestine' => 'ps',
    'panama' => 'pa',
    'papuanewguinea' => 'pg',
    'paraguay' => 'py',
    'peru' => 'pe',
    'philippines' => 'ph',
    'pitcairn' => 'pn',
    'poland' => 'pl',
    'portugal' => 'pt',
    'puertorico' => 'pr',
    'qatar' => 'qa',
    'reunion' => 're',
    'romania' => 'ro',
    'russianfederation' => 'ru',
    'russia' => 'ru',
    'rwanda' => 'rw',
    'saintbarthelemy' => 'bl',
    'sainthelenaascensionandtristandacunha' => 'sh',
    'saintkittsandnevis' => 'kn',
    'saintlucia' => 'lc',
    'saintmartinfrenchpart' => 'mf',
    'saintpierreandmiquelon' => 'pm',
    'saintvincentandthegrenadines' => 'vc',
    'samoa' => 'ws',
    'sanmarino' => 'sm',
    'saotomeandprincipe' => 'st',
    'saudiarabia' => 'sa',
    'senegal' => 'sn',
    'serbia' => 'rs',
    'seychelles' => 'sc',
    'sierraleone' => 'sl',
    'singapore' => 'sg',
    'sintmaartenductchpart' => 'sx',
    'slovakia' => 'sk',
    'slovenia' => 'si',
    'solomonislands' => 'sb',
    'somalia' => 'so',
    'southafrica' => 'za',
    'southgeorgiaandthesouthsandwichislands' => 'gs',
    'southsudan' => 'ss',
    'spain' => 'es',
    'srilanka' => 'lk',
    'sudan' => 'sd',
    'suriname' => 'sr',
    'svalbardandjanmayen' => 'sj',
    'eswatini' => 'sz',
    'swaziland' => 'sz',
    'sweden' => 'se',
    'switzerland' => 'ch',
    'syrianarabrepublic' => 'sy',
    'syria' => 'sy',
    'taiwanprovinceofchina' => 'tw',
    'taiwan' => 'tw',
    'tajikistan' => 'tj',
    'tanzaniaunitedrepublicof' => 'tz',
    'tanzania' => 'tz',
    'thailand' => 'th',
    'timorleste' => 'tl',
    'easttimor' => 'tl',
    'togo' => 'tg',
    'tokelau' => 'tk',
    'tonga' => 'to',
    'trinidadandtobago' => 'tt',
    'tunisia' => 'tn',
    'turkey' => 'tr',
    'turkmenistan' => 'tm',
    'turksandcaicosislands' => 'tc',
    'tuvalu' => 'tv',
    'uganda' => 'ug',
    'ukraine' => 'ua',
    'unitedarabemirates' => 'ae',
    'unitedkingdom' => 'gb',
    'unitedstatesofamerica' => 'us',
    'unitedstatesminoroutlyingislands' => 'um',
    'uruguay' => 'uy',
    'uzbekistan' => 'uz',
    'vanuatu' => 'vu',
    'venezuelabolivarianrepublicof' => 've',
    'venezuela' => 've',
    'vietnam' => 'vn',
    'virginislandsbritish' => 'vg',
    'virginislandsus' => 'vi',
    'wallisandfutuna' => 'wf',
    'westernsahara' => 'eh',
    'yemen' => 'ye',
    'zambia' => 'zm',
    'zimbabwe' => 'zw',
  ];

  // Initialize combined state mappings
  private static function initMappings()
  {
    if (empty(StringUtils::$STATE_MAPPINGS)) {
      StringUtils::$STATE_MAPPINGS = array_merge(
        StringUtils::$CA_PROVINCES,
        StringUtils::$US_STATES
      );
    }
  }

  // Helper: Unicode-safe truncate
  private static function unicodeSafeTruncate($value, $length)
  {
    return StringUtils::unicodeSafeSubstr($value, 0, $length);
  }

  private static function unicodeSafeSubstr($value, $start, $length)
  {
    if (!is_string($value)) {
      return '';
    }
    if (mb_strlen($value) < $length && $start === 0) {
      return $value;
    }
    return mb_substr($value, $start, $length);
  }

  // Helper: Get from map
  private static function getFromMap($input, $mappings)
  {
    if (strlen($input) === 2) {
      return $input;
    }
    if (isset($mappings[$input])) {
      return $mappings[$input];
    }
    foreach ($mappings as $state => $abbreviation) {
      if (strpos($input, $state) !== false) {
        return $abbreviation;
      }
    }
    return strtolower($input);
  }

  // Helper: Normalize two-letter abbreviations
  private static function normalizeTwoLetterAbbreviations($input, $mappings)
  {
    if (SharedUtils::looksLikeHashed($input) || !is_string($input)) {
      return $input;
    }
    $inputStr = strtolower(trim($input));
    $inputStr = preg_replace('/[^a-z]/', '', $inputStr);
    $inputStr = StringUtils::getFromMap($inputStr, $mappings);
    switch (strlen($inputStr)) {
      case 0:
        return null;
      case 1:
        return $inputStr;
      default:
        return substr($inputStr, 0, 2);
    }
  }

  // Core normalization function
  private static function getNormalizeString($input, $params)
  {
    $result = null;
    if ($input !== null) {
      if (SharedUtils::looksLikeHashed($input) && is_string($input)) {
        if (empty($params['rejectHashed'])) {
          $result = $input;
        }
      } else {
        $str = strval($input);
        if (!empty($params['strip'])) {
          $str = SharedUtils::strip($str, $params['strip']);
        }
        if (!empty($params['lowercase'])) {
          $str = strtolower($str);
        } elseif (!empty($params['uppercase'])) {
          $str = strtoupper($str);
        }
        if (!empty($params['truncate'])) {
          $str = StringUtils::unicodeSafeTruncate($str, $params['truncate']);
        }
        if (!empty($params['test'])) {
          $result = preg_match('/' . $params['test'] . '/', $str) ? $str : null;
        } else {
          $result = $str;
        }
      }
    }
    return $result;
  }

  // Name normalization
  public static function getNormalizedName($input)
  {
    $params = [
      'lowercase' => true,
      'strip' => 'whitespace_and_punctuation',
    ];
    return StringUtils::getNormalizeString($input, $params);
  }

  // City normalization
  public static function getNormalizedCity($input)
  {
    $params = [
      'lowercase' => true,
      'strip' => 'all_non_latin_alpha_numeric',
      'test' => '^[a-z]+',
    ];
    return StringUtils::getNormalizeString($input, $params);
  }

  // State normalization
  public static function getNormalizedState($input)
  {
    if ($input === null) {
      return null;
    }
    StringUtils::initMappings();
    $inputStr = $input;
    try {
      $inputStr = StringUtils::normalizeTwoLetterAbbreviations(
        $inputStr,
        StringUtils::$STATE_MAPPINGS
      );
    } catch (\Exception $err) {

      error_log('Failed to normalizeTwoLetterAbbreviations when calling getNormalizedState: ' . $err->getMessage());
    }
    return StringUtils::getNormalizeString($inputStr, [
      'truncate' => 2,
      'strip' => 'all_non_latin_alpha_numeric',
      'test' => '^[a-z]+',
      'lowercase' => true,
    ]);
  }

  // Country normalization
  public static function getNormalizedCountry($input)
  {
    if ($input === null) {
      return null;
    }
    $inputStr = $input;
    try {
      $inputStr = StringUtils::normalizeTwoLetterAbbreviations(
        $inputStr,
        StringUtils::$COUNTRY_MAPPINGS
      );
    } catch (\Exception $err) {

      error_log('Failed to normalizeTwoLetterAbbreviations when calling getNormalizedCountry: ' . $err->getMessage());
    }
    return StringUtils::getNormalizeString($inputStr, [
      'truncate' => 2,
      'strip' => 'all_non_latin_alpha_numeric',
      'test' => '^[a-z]+',
      'lowercase' => true,
    ]);
  }

  // External ID normalization
  public static function getNormalizedExternalID($input)
  {
    if ($input === null) {
      return null;
    }
    return StringUtils::getNormalizeString($input, [
      'lowercase' => true,
      'strip' => 'whitespace_only',
    ]);
  }
}
