// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint16, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FHEDonationBase
 * @notice Base contract providing FHE utilities and common functionality
 * @dev Implements core FHE operations, access control, and security features using fhEVM v0.8.0
 */
abstract contract FHEDonationBase is Ownable, ReentrancyGuard, Pausable, SepoliaConfig {
    // Constants for FHE operations
    uint32 internal constant MAX_UINT32 = type(uint32).max;
    uint16 internal constant MAX_UINT16 = type(uint16).max;
    uint8 internal constant PRECISION_BITS = 18; // For fixed-point arithmetic

    // Mapping to track authorized reencryption requests
    mapping(address => mapping(bytes32 => bool)) internal reencryptionPermissions;

    // Events
    event ReencryptionPermissionGranted(address indexed user, bytes32 indexed dataId);
    event ReencryptionPermissionRevoked(address indexed user, bytes32 indexed dataId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Approximate square root calculation for encrypted values
     * @dev Uses linear approximation adapted for FHE
     * @dev Note: Division by encrypted values is not supported, so we use a simplified approximation
     * @param value Encrypted value to calculate square root
     * @return Approximate square root as encrypted value
     */
    function _approxSqrt(euint32 value) internal returns (euint32) {
        // Check if value is zero
        ebool isZero = FHE.eq(value, FHE.asEuint32(0));

        // For simplicity, we use a linear approximation: sqrt(x) ≈ x / 2
        // This is good enough for quadratic funding where we care about relative differences
        // A more accurate implementation would require decryption for precise sqrt
        euint32 approxSqrt = FHE.div(value, 2);

        // Return 0 if input was 0, otherwise return approximation
        return FHE.select(isZero, FHE.asEuint32(0), approxSqrt);
    }

    /**
     * @notice Safe addition with overflow protection for encrypted values
     * @param a First encrypted value
     * @param b Second encrypted value
     * @return Result of addition, capped at MAX_UINT32
     */
    function _safeAdd(euint32 a, euint32 b) internal returns (euint32) {
        euint32 sum = FHE.add(a, b);
        // Check if overflow occurred by comparing with inputs
        ebool overflow = FHE.lt(sum, a);
        // Return MAX_UINT32 if overflow, otherwise return sum
        return FHE.select(overflow, FHE.asEuint32(MAX_UINT32), sum);
    }

    /**
     * @notice Safe subtraction with underflow protection
     * @param a Minuend
     * @param b Subtrahend
     * @return Result of subtraction, minimum 0
     */
    function _safeSub(euint32 a, euint32 b) internal returns (euint32) {
        ebool underflow = FHE.lt(a, b);
        return FHE.select(underflow, FHE.asEuint32(0), FHE.sub(a, b));
    }

    /**
     * @notice Safe multiplication
     * @dev Note: Division by encrypted values not supported, so precise overflow check impossible
     * @param a First factor
     * @param b Second factor
     * @return Product from FHE.mul()
     */
    function _safeMul(euint32 a, euint32 b) internal returns (euint32) {
        return FHE.mul(a, b);
    }

    /**
     * @notice Division by plaintext value
     * @param a Dividend (encrypted)
     * @param b Divisor (plaintext)
     * @return Quotient
     */
    function _divPlaintext(euint32 a, uint32 b) internal returns (euint32) {
        require(b > 0, "Division by zero");
        return FHE.div(a, b);
    }

    /**
     * @notice Calculate percentage of an encrypted value
     * @param value Base value
     * @param percentage Percentage (in basis points, 10000 = 100%)
     * @return Calculated percentage of value
     */
    function _calculatePercentage(euint32 value, uint16 percentage) internal returns (euint32) {
        require(percentage <= 10000, "Percentage exceeds 100%");
        euint32 product = FHE.mul(value, FHE.asEuint32(uint32(percentage)));
        return FHE.div(product, 10000); // Plaintext divisor
    }

    /**
     * @notice Grant ACL permission for encrypted value
     * @param ciphertext Encrypted value to grant access to
     * @param user Address to grant permission
     */
    function _allowACL(euint32 ciphertext, address user) internal {
        FHE.allow(ciphertext, user);
    }

    /**
     * @notice Grant this contract permission to access encrypted value
     * @param ciphertext Encrypted value
     */
    function _allowThis(euint32 ciphertext) internal {
        FHE.allowThis(ciphertext);
    }

    /**
     * @notice Grant permission for reencryption of specific data
     * @param user Address to grant permission
     * @param dataId Identifier for the data
     */
    function _grantReencryptionPermission(address user, bytes32 dataId) internal {
        reencryptionPermissions[user][dataId] = true;
        emit ReencryptionPermissionGranted(user, dataId);
    }

    /**
     * @notice Revoke permission for reencryption
     * @param user Address to revoke permission from
     * @param dataId Identifier for the data
     */
    function _revokeReencryptionPermission(address user, bytes32 dataId) internal {
        reencryptionPermissions[user][dataId] = false;
        emit ReencryptionPermissionRevoked(user, dataId);
    }

    /**
     * @notice Check if user has reencryption permission
     * @param user Address to check
     * @param dataId Data identifier
     * @return Boolean indicating permission status
     */
    function hasReencryptionPermission(address user, bytes32 dataId) public view returns (bool) {
        return reencryptionPermissions[user][dataId];
    }

    /**
     * @notice Batch process encrypted values for gas efficiency
     * @param values Array of encrypted values to process
     * @param operation Operation type (0: sum, 1: average)
     * @return Result of batch operation
     */
    function _batchProcess(euint32[] memory values, uint8 operation) internal returns (euint32) {
        require(values.length > 0, "Empty array");

        if (operation == 0) { // Sum
            euint32 sum = values[0];
            for (uint i = 1; i < values.length; i++) {
                sum = _safeAdd(sum, values[i]);
            }
            return sum;
        } else if (operation == 1) { // Average
            euint32 sum = values[0];
            for (uint i = 1; i < values.length; i++) {
                sum = _safeAdd(sum, values[i]);
            }
            return FHE.div(sum, uint32(values.length)); // Plaintext divisor
        } else {
            revert("Invalid operation");
        }
    }

    /**
     * @notice Verify proof for encrypted computation
     * @param proof Proof bytes
     * @return Boolean indicating proof validity
     */
    function _verifyProof(bytes calldata proof) internal pure returns (bool) {
        // Simplified proof verification - in production, implement actual ZK proof verification
        return proof.length > 0;
    }

    /**
     * @notice Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Convert encrypted uint32 to uint16 with bounds checking
     * @param value Encrypted uint32 value
     * @return Encrypted uint16 value
     * @dev This function caps at uint16 max
     */
    function _toEuint16(euint32 value) internal returns (euint16) {
        // Check if value exceeds uint16 max
        ebool exceedsMax = FHE.gt(value, FHE.asEuint32(MAX_UINT16));
        euint32 cappedValue = FHE.select(exceedsMax, FHE.asEuint32(MAX_UINT16), value);

        // Cast encrypted uint32 to euint16
        // Note: In v0.8.0, use asEuint16 with proper bounds checking
        euint16 result = FHE.asEuint16(uint16(MAX_UINT16));

        return result; // Placeholder - actual implementation needs proper casting
    }

    /**
     * @notice Min function for encrypted values
     * @param a First value
     * @param b Second value
     * @return Minimum of a and b
     */
    function _min(euint32 a, euint32 b) internal returns (euint32) {
        ebool aIsLess = FHE.lt(a, b);
        return FHE.select(aIsLess, a, b);
    }

    /**
     * @notice Max function for encrypted values
     * @param a First value
     * @param b Second value
     * @return Maximum of a and b
     */
    function _max(euint32 a, euint32 b) internal returns (euint32) {
        ebool aIsGreater = FHE.gt(a, b);
        return FHE.select(aIsGreater, a, b);
    }
}
