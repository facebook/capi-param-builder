<?php
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

namespace Drupal\param_builder\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\param_builder\EventSubscriber\CookieSubscriber;

/**
 * Class ExampleController.
 *
 * @package Drupal\param_builder\Controller
 */
class ExampleController extends ControllerBase {

  /**
   * The example service.
   *
   * @var \Drupal\param_builder\CookieSubscriber
   */
  protected $cookieSubscriber;

  /**
   * Constructs a new ExampleController object.
   *
   * @param \Drupal\param_builder\CookieSubscriber $cookieSubscriber
   *   The cookie service.
   */
  public function __construct(CookieSubscriber $cookieSubscriber) {
    $this->cookieSubscriber = $cookieSubscriber;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('param_builder.cookie_subscriber')
    );
  }

  /**
   * Returns multiple lines of output.
   */
  public function displayCookies() {
    // Fetch the data from the service.
    $cookiesToSet = $this->cookieSubscriber->getCookiesToSet();
    $fbc = $this->cookieSubscriber->getFBC();
    $fbp = $this->cookieSubscriber->getFBP();

    // Construct the render array.
    $output = [
      '#type' => 'markup',
      '#markup' => $this->t('@fbc<br>@fbp', [
        '@fbc' => $fbc,
        '@fbp' => $fbp,
      ]),
    ];

    return $output;

  }

}
