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

// Check if the request method is GET
// Collect data from URL parameters

$param_builder = FacebookParamManager::getInstance()->getParamBuilder();
$data = [
    'event_name' => $_GET['event_name'] ?? null,
    'event_time' => time(),
    'user_data' => [
        'fbc' => $param_builder->getFbc(),
        'fbp' => $param_builder->getFbp()
    ]
];

// Send data to Facebook CAPI
$ch = curl_init('https://graph.facebook.com/v11.0/<YOUR_PIXEL_ID>/events?access_token=<YOUR_ACCESS_TOKEN>');

// Set cURL options
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['data' => [$data]]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen(json_encode(['data' => [$data]]))
]);

// TODO: send the request

echo json_encode(['status' => 'success', 'data' => $data]);
?>
