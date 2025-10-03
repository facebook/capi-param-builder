<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace FacebookAds;

class SharedUtils
{

  // Regex patterns (delimiters are /, and 'u' for unicode where needed)
  const STRIP_WHITESPACE_REGEX = '/\s+/u';
  // Punctuation characters: !"#$%&'()*+,-./:;<=>?@ [\]^_`{|}~
  const STRIP_WHITESPACE_AND_PUNCTUATION_REGEX =
  '/[!"#\$%&\'\(\)\*\+,\-\.\/:;<=>\?@ \[\\\\\]\^_`\{\|\}~\s]+/u';

  const STRIP_NON_LATIN_ALPHA_NUMERIC_REGEX = '/[^a-zA-Z0-9]+/u';

  const SHA_256_OR_MD5_REGEX = '/^[A-Fa-f0-9]{64}$|^[A-Fa-f0-9]{32}$/';

  public static function looksLikeHashed($input)
  {
    // it could be sha256 or md5
    return is_string($input) && preg_match(SharedUtils::SHA_256_OR_MD5_REGEX, $input);
  }

  /**
   * Strips characters from a string based on the mode.
   *
   * @param mixed $obj  The input to strip (only strings are processed).
   * @param string $mode  One of: 'whitespace_only',
   *   'whitespace_and_punctuation', 'all_non_latin_alpha_numeric'
   * @return string

   */
  public static function strip($obj, $mode = 'whitespace_only')
  {
    $result = '';
    if (is_string($obj)) {
      switch ($mode) {
        case 'whitespace_only':
          $result = preg_replace(SharedUtils::STRIP_WHITESPACE_REGEX, '', $obj);
          break;
        case 'whitespace_and_punctuation':
          $result = preg_replace(
            SharedUtils::STRIP_WHITESPACE_AND_PUNCTUATION_REGEX,
            '',
            $obj
          );
          break;

        case 'all_non_latin_alpha_numeric':
          $result = preg_replace(
            SharedUtils::STRIP_NON_LATIN_ALPHA_NUMERIC_REGEX,
            '',
            $obj
          );
          break;
      }
    }
    return $result;
  }
}
