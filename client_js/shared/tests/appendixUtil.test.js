/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getAppendix } from '../utils/appendixUtil.js';
import {
  APPENDIX_GENERAL_NEW,
  APPENDIX_NET_NEW,
  APPENDIX_MODIFIED_NEW,
  APPENDIX_NO_CHANGE,
} from '../model/constants.js';

jest.mock('../version.js', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildDate: '2023-01-01T00:00:00.000Z',
  }),
}));

describe('getAppendix', () => {
  // Expected base64 outputs for version 1.0.0
  const EXPECTED_NO_CHANGE = 'AQYAAQAA';
  const EXPECTED_GENERAL_NEW = 'AQYBAQAA';
  const EXPECTED_NET_NEW = 'AQYCAQAA';
  const EXPECTED_MODIFIED_NEW = 'AQYDAQAA';

  test('returns correct appendix for each appendix type', () => {
    expect(EXPECTED_NO_CHANGE).toBe(getAppendix(APPENDIX_NO_CHANGE));
    expect(EXPECTED_GENERAL_NEW).toBe(getAppendix(APPENDIX_GENERAL_NEW));
    expect(EXPECTED_NET_NEW).toBe(getAppendix(APPENDIX_NET_NEW));
    expect(EXPECTED_MODIFIED_NEW).toBe(getAppendix(APPENDIX_MODIFIED_NEW));
    expect(EXPECTED_NO_CHANGE).toBe(getAppendix()); // default
    expect(EXPECTED_NO_CHANGE).toBe(getAppendix(0x99)); // invalid type
  });
});
