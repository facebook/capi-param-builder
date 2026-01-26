<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

use PHPUnit\Framework\TestCase;
use FacebookAds\AppendixProvider;

require_once __DIR__ . '/../src/util/AppendixProvider.php';
require_once __DIR__ . '/../src/model/Constants.php';

final class AppendixProviderTest extends TestCase
{
    private $original_composer_content = null;
    private $composer_json_path;

    protected function setUp(): void
    {
        // Store the path to composer.json for mocking
        $this->composer_json_path = __DIR__ . '/../composer.json';

        // Backup original composer.json content if it exists
        if (file_exists($this->composer_json_path)) {
            $this->original_composer_content = file_get_contents($this->composer_json_path);
        }
    }

    protected function tearDown(): void
    {
        // Restore original composer.json content
        if ($this->original_composer_content !== null) {
            file_put_contents($this->composer_json_path, $this->original_composer_content);
        } elseif (file_exists($this->composer_json_path)) {
            unlink($this->composer_json_path);
        }
    }

    private function mockSdkVersion($version)
    {
        $composer_data = [
            'name' => 'facebook/capi-param-builder',
            'version' => $version,
            'description' => 'Test version'
        ];

        file_put_contents($this->composer_json_path, json_encode($composer_data, JSON_PRETTY_PRINT));
    }

    /**
     * Helper method to remove composer.json to simulate version not found
     */
    private function removeComposerJson()
    {
        if (file_exists($this->composer_json_path)) {
            unlink($this->composer_json_path);
        }
    }

    public function testGetAppendixWithValidAppendix()
    {
        $this->mockSdkVersion('1.0.1');
        $this->assertEquals(
            "AQEBAQAB",
            AppendixProvider::getAppendix(APPENDIX_GENERAL_NEW)
        );
        $this->assertEquals(
            "AQECAQAB",
            AppendixProvider::getAppendix(APPENDIX_NET_NEW)
        );
        $this->assertEquals(
            "AQEDAQAB",
            AppendixProvider::getAppendix(APPENDIX_MODIFIED_NEW)
        );
        $this->assertEquals(
            "AQEAAQAB",
            AppendixProvider::getAppendix(APPENDIX_NO_CHANGE)
        );
        // Invalid appendix type
        $this->assertEquals(
            "AQEAAQAB",
            AppendixProvider::getAppendix(0x99)
        );

        $this->mockSdkVersion('1.15.24');
        $this->assertEquals(
            "AQEBAQ8Y",
            AppendixProvider::getAppendix(APPENDIX_GENERAL_NEW)
        );
        $this->assertEquals(
            "AQECAQ8Y",
            AppendixProvider::getAppendix(APPENDIX_NET_NEW)
        );
        $this->assertEquals(
            "AQEDAQ8Y",
            AppendixProvider::getAppendix(APPENDIX_MODIFIED_NEW)
        );
        $this->assertEquals(
            "AQEAAQ8Y",
            AppendixProvider::getAppendix(APPENDIX_NO_CHANGE)
        );
        $this->assertEquals(
            "AQEAAQ8Y",
            AppendixProvider::getAppendix(0x99)
        );
    }

    public function testGetAppendixWithInValidAppendix()
    {
        $this->mockSdkVersion('test123');
        $this->assertEquals(
            "AQ",
            AppendixProvider::getAppendix(APPENDIX_GENERAL_NEW)
        );
        $this->assertEquals(
            "AQ",
            AppendixProvider::getAppendix(APPENDIX_NO_CHANGE)
        );

        $this->mockSdkVersion('!@#.%%.^%');
        $this->assertEquals(
            "AQ",
            AppendixProvider::getAppendix(APPENDIX_GENERAL_NEW)
        );
        $this->assertEquals(
            "AQ",
            AppendixProvider::getAppendix(APPENDIX_NO_CHANGE)
        );
    }
}
