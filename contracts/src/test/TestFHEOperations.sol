// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../FHEDonationBase.sol";
import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint32} from "encrypted-types/EncryptedTypes.sol";

/**
 * @title TestFHEOperations
 * @notice Test contract for FHE operations
 */
contract TestFHEOperations is FHEDonationBase {

    constructor() FHEDonationBase() {}

    function testSafeAdd(externalEuint32 a, externalEuint32 b, bytes calldata proofA, bytes calldata proofB) external returns (euint32) {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        euint32 result = _safeAdd(encA, encB);
        return result; // v0.8.0: Cannot decrypt in contract, must use Gateway
    }

    function testSafeSub(externalEuint32 a, externalEuint32 b, bytes calldata proofA, bytes calldata proofB) external returns (euint32) {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        euint32 result = _safeSub(encA, encB);
        return result; // v0.8.0: Cannot decrypt in contract, must use Gateway
    }

    function testSafeMul(externalEuint32 a, externalEuint32 b, bytes calldata proofA, bytes calldata proofB) external returns (euint32) {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        euint32 result = _safeMul(encA, encB);
        return result; // v0.8.0: Cannot decrypt in contract, must use Gateway
    }

    function testDivPlaintext(externalEuint32 a, bytes calldata proof, uint32 b) external returns (euint32) {
        euint32 encA = FHE.fromExternal(a, proof);
        euint32 result = _divPlaintext(encA, b);
        return result; // v0.8.0: Cannot decrypt in contract
    }

    function testCalculatePercentage(externalEuint32 value, bytes calldata proof, uint16 percentage) external returns (euint32) {
        euint32 encValue = FHE.fromExternal(value, proof);
        euint32 result = _calculatePercentage(encValue, percentage);
        return result; // v0.8.0: Cannot decrypt in contract
    }

    function testApproxSqrt(externalEuint32 value, bytes calldata proof) external returns (euint32) {
        euint32 encValue = FHE.fromExternal(value, proof);
        euint32 result = _approxSqrt(encValue);
        return result; // v0.8.0: Cannot decrypt in contract
    }

    function testBatchProcess(externalEuint32[] calldata values, bytes[] calldata proofs, uint8 operation) external returns (euint32) {
        euint32[] memory encValues = new euint32[](values.length);
        for (uint i = 0; i < values.length; i++) {
            encValues[i] = FHE.fromExternal(values[i], proofs[i]);
        }
        euint32 result = _batchProcess(encValues, operation);
        return result; // v0.8.0: Cannot decrypt in contract
    }

    function testMin(externalEuint32 a, externalEuint32 b, bytes calldata proofA, bytes calldata proofB) external returns (euint32) {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        euint32 result = _min(encA, encB);
        return result; // v0.8.0: Cannot decrypt in contract
    }

    function testMax(externalEuint32 a, externalEuint32 b, bytes calldata proofA, bytes calldata proofB) external returns (euint32) {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        euint32 result = _max(encA, encB);
        return result; // v0.8.0: Cannot decrypt in contract
    }
}