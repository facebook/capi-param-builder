# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

from typing import Optional

from capi_param_builder import EtldPlusOneResolver


class TestEtldPlusOneResolver(EtldPlusOneResolver):
    def resolve(self, host_name: str) -> Optional[str]:
        return host_name
