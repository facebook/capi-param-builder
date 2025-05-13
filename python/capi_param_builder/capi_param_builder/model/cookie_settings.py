# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.

# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.

from dataclasses import dataclass


@dataclass
class CookieSettings:
    """
    Cookie settings
    """

    name: str
    value: str
    domain: str
    max_age: int

    def __eq__(self, name: str, value: str, domain: str, max_age: int) -> bool:
        return (
            self.name == name
            and self.value == value
            and self.domain == domain
            and self.max_age == max_age
        )

    def __hash__(self) -> int:
        return hash(self.name + self.value + self.domain + str(self.max_age))
