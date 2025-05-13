<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
require 'vendor/autoload.php';
require 'FacebookParamManager.php';

// call processThisRequest on every request
FacebookParamManager::getInstance()->processThisRequest();

?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cookie Consent</title>
<link rel="stylesheet" href="/public/styles.css">
</head>
<body>
<div id="cookieConsentContainer" class="cookie-consent-container">
  <div class="content">
    <p>This website uses cookies to ensure you get the best experience on our website.</p>
    <button onclick="onAcceptCookieConsentClick()">Accept</button>
  </div>
</div>

<script src="/public/cookie-consent.js"></script>
<script>
    if (getCookie("cookiesAccepted") == 'true') {
        logPageViewEvent();
    }

    function onAcceptCookieConsentClick() {
        acceptCookies();
        logPageViewEvent();
    }

    function logPageViewEvent() {
        fetch('/log_event.php?event_name=PageView');
    }
</script>
</body>
</html>
