# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

from dataclasses import dataclass


@dataclass
class FbcParamConfigs:
    """
    fbc params configs
    """

    query: str
    prefix: str
    ebp_path: str
