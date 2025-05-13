# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

class FbcParamConfigs
    attr_accessor :query, :prefix, :ebp_path
    def initialize(query, prefix, ebp_path)
      @query = query
      @prefix = prefix
      @ebp_path = ebp_path
    end
end
