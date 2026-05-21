# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class PlainDataObject:
    """
    Plain data object representing the request inputs needed by the
    param builder (host, query params, cookies, and optional headers).
    """

    host: str
    query_params: Dict[str, List[str]]
    cookies: Dict[str, str]
    referer: Optional[str]
    x_forwarded_for: Optional[str]
    remote_address: Optional[str]
    scheme: Optional[str] = None
    request_uri: Optional[str] = None
