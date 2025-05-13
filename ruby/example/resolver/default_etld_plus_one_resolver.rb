# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

require 'capi_param_builder/etld_plus_one_resolver'

class DefaultEtldPlusOneResolver < EtldPlusOneResolver
    def resolve(host_name)
        puts "Resolved etld+1: #{host_name} from DefaultEtldPlusOneResolver"
        # Your implementation
        return host_name
    end
end
