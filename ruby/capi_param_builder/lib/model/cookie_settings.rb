# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

class CookieSettings
    attr_accessor :name, :value, :domain, :max_age
    def initialize(name, value, domain, max_age)
      @name = name
      @value = value
      @domain = domain
      @max_age = max_age
    end
end
