LocalTransfer.tsx was briefly overwritten. Restore the full page from commit a120e2a338792ec2ff4d51974ff66fe0a245dc21 (blob 97db6f7143967254661664e623c79f79788ea27a), then apply gateSucceeded so verified transfers stay pending instead of cancelled.

In CodeGate onOpenChange: only set status cancelled when pendingTxId is set AND gateSucceeded.current is false.
In onVerified: set gateSucceeded.current = true before clearing pendingTxId.
