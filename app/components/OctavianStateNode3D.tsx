// WebGPU vs WebGL hybrid
const rendererType = 'webgpu' in navigator.gpu ? 'webgpu' : 'webgl';
<Canvas gl={rendererType === 'webgpu' ? { renderer: 'webgpu' } : {}} > // Auto best + fallback + toggle