import { mat4 } from "gl-matrix";

export function initMapDrawing(gl: WebGLRenderingContext) {
    const VERTEX_SHADER_IN_LOCATION = 0
    const VERTEX_SHADER_IN_VEC_LEN = 3

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vsSource = `
        attribute vec4 a_position;
        
        void main() {
            gl_Position = a_position;
        }
        `

    const fsSource = `
        precision mediump float;
    
        void main() {
            gl_FragColor = vec4(1, 0, 0.5, 1);
        }
        `

    const positionBuffer = gl.createBuffer();
    if (positionBuffer === null) {
        throw Error("failed to create buffer")
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        0.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
        0.0,  0.5, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (vertexShader === null) {
        throw Error("failed to create vertex shader")
    }
    gl.shaderSource(vertexShader, vsSource)
    gl.compileShader(vertexShader)

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (fragmentShader === null) {
        throw Error("failed to create fragment shader")
    }
    gl.shaderSource(fragmentShader, fsSource)
    gl.compileShader(fragmentShader)

    const shaderProgram = gl.createProgram()
    if (shaderProgram === null) {
        throw Error("failed to create shader program")
    }

    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
    gl.useProgram(shaderProgram)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    gl.vertexAttribPointer(VERTEX_SHADER_IN_LOCATION, VERTEX_SHADER_IN_VEC_LEN, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(VERTEX_SHADER_IN_LOCATION)

}
