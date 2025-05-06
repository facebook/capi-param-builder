<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
namespace Drupal\param_builder\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpFoundation\Cookie;
use FacebookAds\ParamBuilder;
use FacebookAds\ETLDPlus1Resolver;

// Following just a customized example to integrate ETLDPlus1.
class ExampleETLDPlus1Resolver implements ETLDPlus1Resolver {
    public function resolveETLDPlus1($domain) {
      return $domain;
  }
}

/**
 * Class CookieSubscriber.
 *
 * Subscribes to the kernel request event to fetch cookies.
 */
class CookieSubscriber implements EventSubscriberInterface {

  const COOKIE_AGREED_VALUE = 2;
  protected $cookieAgreed;

  protected $param_builder;
  /**
   * Constructs a CookieSubscriber object.
   */
  public function __construct($customETLDPlusResolver = null) {
    // $exampleResolver won't resolve any etld+1 domain, only for local test
    // $exampleResolver = new ExampleETLDPlus1Resolver();
    // When $customETLDPlusResolver is null, we'll use our default ETLD+1
    // which will retrieve etld+1 based on public prefix
    $this->param_builder = new ParamBuilder($customETLDPlusResolver);
    $this->cookieAgreed = true;
  }

  /**
   * Fetches cookies from the HTTP request.
   *
   * @param \Symfony\Component\HttpKernel\Event\RequestEvent $event
   *   The event to process.
   */
  public function onKernelRequest(RequestEvent $event) {
    $request = $event->getRequest();

    // Get HTTP_HOST equivalent.
    $http_host = $request->getHost();

    // Get GET parameters equivalent.
    $get_params = $request->query->all();

    // Get COOKIE values equivalent.
    $cookies = $request->cookies->all();

    // if EU Cookie Compliance module is being used
    if (isset($cookies['cookie-agreed'])) {
      // Get the value of the 'cookie-agreed' cookie.
      $this->cookieAgreed =
        $cookies['cookie-agreed'] == self::COOKIE_AGREED_VALUE;
    }

    if($this->cookieAgreed){
        $this->param_builder->processRequest(
          $http_host,
          $get_params,
          $cookies
      );
    }
  }

  /**
   * Sets a cookie in the HTTP response.
   *
   * @param \Symfony\Component\HttpKernel\Event\ResponseEvent $event
   *   The event to process.
   */
  public function onKernelResponse(ResponseEvent $event) {

    if($this->cookieAgreed){
      // Add the cookie to the response.
      $response = $event->getResponse();

      foreach ($this->param_builder->getCookiesToSet() as $cookie) {
        $response->headers->setCookie(new Cookie(
          $cookie->name,
          $cookie->value,
          time() + $cookie->max_age,
          '/',
          $cookie->domain
        ));
        // Note: it should never be HttpOnly
      }
    }
  }


  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    $events = [];
    $events[KernelEvents::REQUEST][] = ['onKernelRequest'];
    $events[KernelEvents::RESPONSE][] = ['onKernelResponse'];
    return $events;
  }

  public function getCookiesToSet() {
    return $this->param_builder->getCookiesToSet();
  }

  public function getFbc() {
      return $this->param_builder->getFbc();
  }

  public function getFbp() {
      return $this->param_builder->getFbp();
  }

}
