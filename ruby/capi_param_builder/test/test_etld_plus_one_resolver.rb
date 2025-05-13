# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require_relative '../lib/model/etld_plus_one_resolver'

class TestEtldPlusOneResolver < EtldPlusOneResolver
    def resolve(host_name)
        return host_name
    end
end
