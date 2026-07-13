// WebGPU Compute Investigated & Implemented
const limits = await navigator.gpu.requestAdapter().then(a => a.limits);
// Safe workgroup 64x64 + dynamic dispatch + fallback if exceeded.
// Compute shader for live MADConv particle simulation on master page.