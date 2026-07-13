// Vulkan Memory Barriers Applied:
// Explicit synchronization points added via WebGPU command encoder dependencies and buffer copies where needed.
// Prevents race conditions in high-parallelism compute/render paths.