# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

class EtldPlusOneResolver
    def resolve(host_name)
        raise NotImplementedError, "Subclasses must implement the resolve method."
    end
end
