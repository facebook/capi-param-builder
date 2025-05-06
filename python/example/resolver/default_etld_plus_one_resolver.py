# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

from typing import Optional

from capi_param_builder import EtldPlusOneResolver


class DefaultEtldPlusOneResolver(EtldPlusOneResolver):
    """
    Default implementation of EtldPlusOneResolver
    """

    def resolve(self, host_name: str) -> Optional[str]:
        # Start your implementation to get etld+1 from host_name
        etld_plus_one = host_name
        # Return the resolved etld+1
        return etld_plus_one
