<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
use PHPUnit\Framework\TestCase;
use FacebookAds\ParamBuilder;
use FacebookAds\ETLDPlus1Resolver;
use FacebookAds\FbcParamConfig;
use FacebookAds\Constants;
require_once 'ETLDPlus1ResolverForUnitTest.php';

final class ParamBuilderTest extends TestCase {

    public function testConstructorWithEtldPlusOne() {
        $builderWithResolver = new ParamBuilder(
            new ETLDPlus1ResolverForUnitTest());
        $reflector = new ReflectionClass($builderWithResolver);
        $property = $reflector->getProperty('etld_plus1_resolver');
        $property->setAccessible(true);
        $etld_plus1_resolver = $property->getValue($builderWithResolver);
        $test = $etld_plus1_resolver->resolveETLDPlus1('test_domain');
        $this->assertEquals('test_domain', $test);
    }

    public function testConstructorWithDomainList() {
        $builderWithDomain = new ParamBuilder(array('example.com', 'test.com'));
        $reflector = new ReflectionClass($builderWithDomain);
        $property = $reflector->getProperty('domain_list');
        $property->setAccessible(true);
        $domain_list = $property->getValue($builderWithDomain);
        $this->assertEquals(array('example.com', 'test.com'), $domain_list);
    }

    public function testConstructorWithEmptyInput() {
        $builderEmptyInput = new ParamBuilder();
        $reflector = new ReflectionClass($builderEmptyInput);
        // empty etld+1
        $property = $reflector->getProperty('etld_plus1_resolver');
        $property->setAccessible(true);
        $etld_plus1_resolver = $property->getValue($builderEmptyInput);
        $this->assertEquals(null, $etld_plus1_resolver);

        // empty domain list
        $propertyDomain = $reflector->getProperty('domain_list');
        $propertyDomain->setAccessible(true);
        $domain = $propertyDomain->getValue($builderEmptyInput);
        $this->assertEquals(null, $domain);
    }

    public function testConstructorWithParamConfigsUpdate() {
        // Mock param configs
        $builderWithParamConfig = new ParamBuilder();
        $reflector = new ReflectionClass($builderWithParamConfig);
        // Update params configs
        $property = $reflector->getProperty('fbc_param_configs');
        $property->setAccessible(true);
        $property->setValue($builderWithParamConfig, array(
            new FbcParamConfig(FBCLID, '', CLICK_ID_STRING),
            new FbcParamConfig("query", 'test', "test_string"),
        ));
        $result = $builderWithParamConfig->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'abc',
                'query' => 'test123',
            ),
            [],
            null
        );
        $this->assertIsString($builderWithParamConfig->getFbc());
        $this->assertStringEndsWith('.abc_test_test123.AQ',
            $builderWithParamConfig->getFbc());
        $this->assertIsString($builderWithParamConfig->getFbp());
        $this->assertStringEndsWith('.AQ', $builderWithParamConfig->getFbp());
    }

    public function testConstructorWithParamConfigsButNoQueryMatched() {
        // Mock param configs
        $builderWithParamConfig = new ParamBuilder();
        $reflector = new ReflectionClass($builderWithParamConfig);
        // Update params configs
        $property = $reflector->getProperty('fbc_param_configs');
        $property->setAccessible(true);
        $property->setValue($builderWithParamConfig, array(
            new FbcParamConfig(FBCLID, '', CLICK_ID_STRING),
            new FbcParamConfig("query", 'test', "test_string"),
        ));
        $result = $builderWithParamConfig->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'abc',
                'test123' => 'test_123',
            ),
            [],
            null
        );
        $this->assertIsString($builderWithParamConfig->getFbc());
        $this->assertStringEndsWith('.abc.AQ',
            $builderWithParamConfig->getFbc());
        $this->assertIsString($builderWithParamConfig->getFbp());
        $this->assertStringEndsWith('.AQ', $builderWithParamConfig->getFbp());
    }

    public function testConstructorWithParamConfigsWithRefererMatched() {
        // Mock param configs
        $builderWithParamConfig = new ParamBuilder();
        $reflector = new ReflectionClass($builderWithParamConfig);
        // Update params configs
        $property = $reflector->getProperty('fbc_param_configs');
        $property->setAccessible(true);
        $property->setValue($builderWithParamConfig, array(
            new FbcParamConfig(FBCLID, '', CLICK_ID_STRING),
            new FbcParamConfig("query", 'test', "test_string"),
        ));
        $result = $builderWithParamConfig->processRequest(
            'a.b.walmart.com:8080',
            null,
            [],
            "https://walmart.com?fbclid=abc&query=test123"
        );
        $this->assertIsString($builderWithParamConfig->getFbc());
        $this->assertStringEndsWith('.abc_test_test123.AQ',
            $builderWithParamConfig->getFbc());
        $this->assertIsString($builderWithParamConfig->getFbp());
        $this->assertStringEndsWith('.AQ', $builderWithParamConfig->getFbp());
    }

    public function testConstructorWithParamConfigsWithBothQueryAndReferer() {
        // Mock param configs
        $builderWithParamConfig = new ParamBuilder();
        $reflector = new ReflectionClass($builderWithParamConfig);
        // Update params configs
        $property = $reflector->getProperty('fbc_param_configs');
        $property->setAccessible(true);
        $property->setValue($builderWithParamConfig, array(
            new FbcParamConfig(FBCLID, '', CLICK_ID_STRING),
            new FbcParamConfig("query", 'test', "test_string"),
        ));
        $result = $builderWithParamConfig->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'qabc',
                'query' => 'qtest123',
            ),
            [],
            "https://walmart.com?fbclid=rabc&query=rtest123"
        );
        $this->assertIsString($builderWithParamConfig->getFbc());
        $this->assertStringEndsWith('.qabc_test_qtest123.AQ',
            $builderWithParamConfig->getFbc());
        $this->assertIsString($builderWithParamConfig->getFbp());
        $this->assertStringEndsWith('.AQ', $builderWithParamConfig->getFbp());
    }

    public function testConstructorWithParamConfigsWithBothQueryAndRefererMix() {
        // Mock param configs
        $builderWithParamConfig = new ParamBuilder();
        $reflector = new ReflectionClass($builderWithParamConfig);
        // Update params configs
        $property = $reflector->getProperty('fbc_param_configs');
        $property->setAccessible(true);
        $property->setValue($builderWithParamConfig, array(
            new FbcParamConfig(FBCLID, '', CLICK_ID_STRING),
            new FbcParamConfig("query", 'test', "test_string"),
        ));
        $result = $builderWithParamConfig->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'qabc',
                'sample' => 'qtest123',
            ),
            [],
            "https://walmart.com?fbclid=rabc&query=rtest123"
        );
        $this->assertIsString($builderWithParamConfig->getFbc());
        $this->assertStringEndsWith('.qabc_test_rtest123.AQ',
            $builderWithParamConfig->getFbc());
        $this->assertIsString($builderWithParamConfig->getFbp());
        $this->assertStringEndsWith('.AQ', $builderWithParamConfig->getFbp());
    }

    public function testProcessRequest() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'abc'
            ),
            [],
            null
        );
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.abc.AQ', $builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.AQ', $builder->getFbp());
    }

    public function testProcessRequestWithReferral() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            null,
            null,
            'walmart.com?fbclid=test123'
        );
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('test123.AQ', $builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.AQ', $builder->getFbp());
    }

     public function testProcessRequestWithReferralWithoutQuery() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            null,
            null,
            'walmart.com'
        );
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.AQ', $builder->getFbp());
    }

    public function testProcessRequestWithRefererAndProtocol() {
        $builder = new ParamBuilder();
        $result = $builder->processRequest(
            'a.b.walmart.com:8080',
            [''],
            [' '],
            'https://walmart.com?fbclid=test123'
        );
        $this->assertEquals(2, count($result));
        $this->assertIsString($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        foreach ($result as $cookie) {
            if ($cookie->name === '_fbc') {
                $this->assertStringEndsWith('.test123.AQ', $cookie->value);
                $this->assertEquals('b.walmart.com', $cookie->domain);
            } else {
                $this->assertEquals('_fbp', $cookie->name);
                $this->assertStringEndsWith('.AQ', $cookie->value);
            }
        }
    }

    public function testProcessRequestWithDomainListAndProtocol() {
        $builder = new ParamBuilder(array('https://example.com:8080'));
        $result = $builder->processRequest(
            'http://a.b.example.com:8080',
            ['fbclid' => 'test123'],
            [],
            null
        );
        $this->assertEquals(2, count($result));
        $this->assertIsString($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        foreach ($result as $cookie) {
            if ($cookie->name === '_fbc') {
                $this->assertStringEndsWith('.test123.AQ', $cookie->value);
                $this->assertEquals('example.com', $cookie->domain);
            } else {
                $this->assertEquals('_fbp', $cookie->name);
                $this->assertStringEndsWith('.AQ', $cookie->value);
            }
        }
    }

    public function testProcessRequestNoReferralSet() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array('fbclid' => 'test123'),
            []
        );
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.test123.AQ', $builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestWithUnusedInfo() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array('fbc' => 'test123'),
            array(
                '_fbwhatever' => 'fb.1.123.AQ'
            ),
        );
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.AQ', $builder->getFbp());
    }

    public function testProcessRequestWithInvalidCookies() {
        $builder = new ParamBuilder();
        $result = $builder->processRequest(
            'a.b.walmart.com:8080',
            null,
            array(
                '_fbc' => 'fb.1.123.abc.456.789',
                '_fbp' => 'fb.1.123.'
            ),
            null
        );
        $this->assertEquals(1, count($result));
        $this->assertEquals('_fbp', $result[0]->name);
        $this->assertNull($builder->getFbc());
        $this->assertIsString($builder->getFbp());
        $this->assertStringEndsWith('.AQ', $builder->getFbp());
    }

    public function testProcessRequestWithExistingFbc() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array(),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertEquals('fb.1.123.abc.AQ', $builder->getFbc());
    }

    public function testProcessRequestWithExistingCookie() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'abc'
            ),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertEquals('fb.1.123.abc.AQ', $builder->getFbc());
    }

    public function testProcessRequestWithOutdatedCookie() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array(
                'fbclid' => 'def'
            ),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertStringEndsWith('def.AQ', $builder->getFbc());
    }

    public function testProcessRequestWithInvalidLanguageToken() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array(),
            array( // invalid language token, return null in preprocess
                '_fbc' => 'fb.1.123.abc.ABC',
                '_fbp' => 'fb.1.123.4567.ABC'
            ),
            null
        );
        $this->assertEquals(null, $builder->getFbc());
        // Since existing fbp is null, we will generate a new one
        $this->assertStringEndsWith('.AQ', $builder->getFbp());
    }

    public function testProcessRequestWithValidCookiesWithoutLanguageToken() {
        $builder = new ParamBuilder();
        $result = $builder->processRequest(
            'a.b.walmart.com:8080',
            null,
            array(
                '_fbc' => 'fb.1.123.abc', // valid format
                '_fbp' => 'fb.1.123.4567.' // invalid with extra dot.
            ),
            null
        );
        $this->assertEquals(2, count($result));
        foreach ($result as $cookie) {
            if ($cookie->name === '_fbc') {
                $this->assertEquals('fb.1.123.abc.AQ', $cookie->value);
            } else {
                $this->assertEquals('_fbp', $cookie->name);
                $this->assertStringEndsWith('.AQ', $cookie->value);
            }
        }
    }

    public function testProcessRequestWithValidOtherLanguageToken() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            'a.b.walmart.com:8080',
            array(),
            array(
                '_fbc' => 'fb.1.123.abc.Bg', // client JS
                '_fbp' => 'fb.1.123.4567.Bg' // client
            ),
            null
        );
        $this->assertEquals('fb.1.123.abc.Bg', $builder->getFbc());
        $this->assertEquals('fb.1.123.4567.Bg', $builder->getFbp());
    }

    public function testProcessRequestWithIP() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            '127.0.0.1:8080',
            array(
                'fbclid' => 'abc'
            ),
            [],
            null
        );
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.abc.AQ', $builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestWithIPv6() {
        $builder = new ParamBuilder();
        $builder->processRequest(
            '[::1]:8080',
            array(
                'fbclid' => 'abc'
            ),
            [],
            null
        );
        $this->assertIsString($builder->getFbc());
        $this->assertStringEndsWith('.abc.AQ', $builder->getFbc());
        $this->assertIsString($builder->getFbp());
    }

    public function testProcessRequestWithResolverInput() {
        $builder = new ParamBuilder(new ETLDPlus1ResolverForUnitTest());
        $cookies_to_set = $builder->processRequest(
            'localhost.balabala.com',
            array(
                'fbclid' => 'test123'
            ),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertEquals(2, count($cookies_to_set));
        $cookie = $cookies_to_set[0];
        $this->assertEquals('localhost.balabala.com', $cookie->domain);
    }

    public function testProcessRequestWithDomainListInput() {
        $builder = new ParamBuilder(array('example.com', 'test.com'));
        $cookies_to_set = $builder->processRequest(
            'localhost.balabla.test.com',
            array(
                'fbclid' => 'test123'
            ),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertEquals(2, count($cookies_to_set));
        $cookie = $cookies_to_set[0];
        $this->assertEquals('test.com', $cookie->domain);
    }

    public function testProcessRequestWithEmptyInput() {
        $builder = new ParamBuilder();
        $cookies_to_set = $builder->processRequest(
            'localhost.balabla.test.com',
            array(
                'fbclid' => 'test123'
            ),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertEquals(2, count($cookies_to_set));
        $cookie = $cookies_to_set[0];
        $this->assertEquals('balabla.test.com', $cookie->domain);
    }

    public function testProcessRequestWithMismatchedDomain() {
        $builder = new ParamBuilder(array('example.com', 'test.com'));
        $cookies_to_set = $builder->processRequest(
            'localhost.balabla.123test.com',
            array(
                'fbclid' => 'test123'
            ),
            array(
                '_fbc' => 'fb.1.123.abc'
            ),
            null
        );
        $this->assertEquals(2, count($cookies_to_set));
        $cookie = $cookies_to_set[0];
        $this->assertEquals('balabla.123test.com', $cookie->domain);
    }

}



?>
